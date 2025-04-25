import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { enhancedApiRequest } from "./api-interceptor";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Original API request function
 * @deprecated Use enhancedApiRequest from api-interceptor.ts instead
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // We now delegate to the enhanced version that includes error logging
  return enhancedApiRequest(method as any, url, data);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Handle array query keys like ['/api/analytics', userId]
    const baseUrl = queryKey[0] as string;
    const params = queryKey.slice(1);
    
    // Build the URL with params if they exist
    let url = baseUrl;
    if (params.length > 0 && baseUrl.includes(':id')) {
      // Replace :id placeholder with actual id
      url = baseUrl.replace(':id', params[0] as string);
    } else if (params.length > 0) {
      // Append the params to the URL
      url = `${baseUrl}/${params.join('/')}`;
    }
    
    // Use enhanced API request for better error tracking
    const res = await enhancedApiRequest("GET", url, undefined);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
