import { apiRequest } from "./queryClient";

/**
 * Enhanced version of apiRequest that logs errors to the server
 * @param method - HTTP method to use
 * @param url - API endpoint URL
 * @param body - Optional request body
 * @returns Response from the server
 */
export async function enhancedApiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  body?: any
): Promise<Response> {
  try {
    const response = await apiRequest(method, url, body);
    
    // If response is not ok, send error details to the server for logging
    if (!response.ok) {
      const errorDetails = {
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        errorContent: await getResponseContent(response.clone()),
      };
      
      // Log the error on the server
      logClientError(errorDetails).catch(err => {
        console.error("Failed to log client error:", err);
      });
    }
    
    return response;
  } catch (error) {
    // Handle network or other errors
    const errorDetails = {
      url,
      method,
      status: 0, // 0 usually means network error
      statusText: error instanceof Error ? error.message : "Unknown error",
      errorContent: error,
    };
    
    // Log the error on the server
    logClientError(errorDetails).catch(err => {
      console.error("Failed to log client error:", err);
    });
    
    // Re-throw the original error to maintain the error chain
    throw error;
  }
}

/**
 * Helper function to extract response content safely
 */
async function getResponseContent(response: Response): Promise<string | object> {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (e) {
    return "Could not parse response content";
  }
}

/**
 * Sends error details to the server for logging
 */
async function logClientError(errorDetails: any): Promise<void> {
  try {
    await apiRequest("POST", "/api/client-error", {
      errorData: errorDetails,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      clientInfo: {
        language: navigator.language,
        platform: navigator.platform,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        }
      }
    });
  } catch (e) {
    // Silently fail if we can't log the error
    console.error("Error logging failed:", e);
  }
}