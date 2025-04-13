import { storage } from './storage';
import { Request } from 'express';
import { log } from './vite';

/**
 * Logs an error to the database
 * @param error The error to log
 * @param req Optional Express request object to extract additional context
 */
export async function logErrorToDatabase(
  error: Error | string, 
  req?: Request
): Promise<void> {
  try {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? null : error.stack || null;
    
    // Extract information from request if available
    const userId = req?.user?.id || null;
    const route = req?.path || null;
    const method = req?.method || null;
    
    // Prepare metadata
    const metadata = req ? {
      query: req.query,
      body: req.body,
      headers: req.headers,
    } : {};
    
    // Log to database
    await storage.logError({
      errorMessage,
      errorStack,
      userId,
      metadata,
      route,
      method,
    });
    
    log(`Logged error to database: ${errorMessage}`);
  } catch (logError) {
    // If logging fails, just log to console
    log(`Failed to log error to database: ${logError}`);
    log(`Original error: ${error}`);
  }
}