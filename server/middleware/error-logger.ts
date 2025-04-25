import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware to log non-200 HTTP responses
 * This intercepts all responses and logs details for any that aren't 200 status
 */
export const errorLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original URL and method
  const url = req.originalUrl || req.url;
  const method = req.method;
  const headers = { ...req.headers };
  
  // Store request body if available
  let requestBody = req.body;
  if (requestBody && typeof requestBody === 'object') {
    // Don't log sensitive data
    if ('password' in requestBody) {
      requestBody = { ...requestBody, password: '[REDACTED]' };
    }
    if ('token' in requestBody) {
      requestBody = { ...requestBody, token: '[REDACTED]' };
    }
  }
  
  // Capture original methods
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Extend json method to capture response data
  res.json = function(body: any): Response {
    logErrorIfNeeded(res.statusCode, body);
    return originalJson.apply(res, [body]);
  };
  
  // Extend send method to capture response data
  res.send = function(body: any): Response {
    logErrorIfNeeded(res.statusCode, body);
    return originalSend.apply(res, [body]);
  };
  
  // Instead of modifying res.end, we'll use the 'finish' event
  res.on('finish', () => {
    if (res.statusCode !== 200) {
      logErrorIfNeeded(res.statusCode);
    }
  });
  
  function logErrorIfNeeded(statusCode: number, responseBody?: any) {
    // Only log if status is not 200
    if (statusCode !== 200) {
      const userId = req.user?.id || null;
      const timestamp = new Date();
      
      // If the body is an object, format it for logging
      let responseContent = responseBody;
      if (responseBody && typeof responseBody === 'object') {
        try {
          responseContent = JSON.stringify(responseBody);
        } catch (err) {
          responseContent = 'Error serializing response body';
        }
      }
      
      // Collect response headers
      const responseHeaders: Record<string, string> = {};
      const headerNames = res.getHeaderNames();
      for (const name of headerNames) {
        responseHeaders[name] = res.getHeader(name) as string;
      }
      
      // Create metadata object
      const metadata = {
        url,
        method,
        requestHeaders: headers,
        requestBody,
        responseHeaders,
        responseBody: responseContent
      };
      
      // Log error asynchronously to not block the response
      Promise.resolve().then(() => {
        storage.logError({
          userId,
          errorMessage: `HTTP ${statusCode} Error: ${url}`,
          errorStack: null,
          metadata,
          route: url,
          method
        }).catch(err => {
          console.error('Failed to log HTTP error:', err);
        });
      });
    }
  }
  
  next();
};