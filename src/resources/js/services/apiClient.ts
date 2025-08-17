/**
 * API Client utility for standardized API requests with error handling
 */

/**
 * Custom API error class with additional properties
 */
export class ApiError extends Error {
  status: number;
  data?: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Common HTTP status codes and their meanings
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 422,
  SERVER_ERROR = 500,
}

/**
 * Options for API requests
 */
export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  baseUrl?: string;
  withCredentials?: boolean;
}

/**
 * Default API request options
 */
const defaultOptions: Partial<ApiRequestOptions> = {
  baseUrl: '/api',
  withCredentials: true,
};

/**
 * Make an API request with standardized error handling
 * 
 * @param endpoint - API endpoint to call (without the base URL)
 * @param options - Request options
 * @returns Promise with the API response data
 * @throws ApiError if the request fails
 */
export async function apiRequest<T>(
x``  endpoint: string, 
  options: ApiRequestOptions = {}
): Promise<T> {
  const { 
    params, 
    baseUrl = defaultOptions.baseUrl, 
    withCredentials = defaultOptions.withCredentials,
    ...fetchOptions 
  } = options;

  // Build URL with query parameters
  let url = `${baseUrl}${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }
    
    const queryString = queryParams.toString();
    if (queryString) {
      url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(fetchOptions.headers || {}),
      },
      credentials: withCredentials ? 'include' : 'same-origin',
      ...fetchOptions,
    });
    
    // For 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    // Try to parse response as JSON
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        // Try to parse text as JSON anyway (some APIs return JSON without proper content type)
        data = JSON.parse(text);
      } catch {
        // If it's not JSON, use the raw text
        data = { message: text };
      }
    }
    
    if (!response.ok) {
      throw new ApiError(
        data?.message || `API request failed with status ${response.status}`,
        response.status,
        data
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      // Already formatted error
      throw error;
    } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // Network error
      console.error('Network error:', error);
      throw new ApiError('Network error. Please check your connection and try again.', 0);
    } else if (error instanceof Error) {
      // Other error types
      console.error('API request failed:', error);
      throw new ApiError(error.message, 0);
    } else {
      // Unknown error
      console.error('Unknown API error:', error);
      throw new ApiError('An unknown error occurred', 0);
    }
  }
}

/**
 * Shorthand for GET requests
 */
export function get<T>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Shorthand for POST requests
 */
export function post<T>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Shorthand for PUT requests
 */
export function put<T>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Shorthand for PATCH requests
 */
export function patch<T>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Shorthand for DELETE requests
 */
export function del<T>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}
