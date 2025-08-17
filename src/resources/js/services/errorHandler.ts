import { ApiError, HttpStatus } from './apiClient';

/**
 * Error response structure
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * Default error messages by status code
 */
const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input and try again.',
  401: 'You need to be authenticated to access this resource.',
  403: 'You do not have permission to access this resource.',
  404: 'The requested resource was not found.',
  422: 'Validation failed. Please check your input and try again.',
  429: 'Too many requests. Please try again later.',
  500: 'An unexpected error occurred on the server. Please try again later.',
  502: 'Bad gateway. The server is temporarily unavailable. Please try again later.',
  503: 'Service unavailable. The server is temporarily unavailable. Please try again later.',
  504: 'Gateway timeout. The server took too long to respond. Please try again later.',
};

/**
 * Global error handler for API errors
 * 
 * @param error - Error object from API call
 * @returns User-friendly error message
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    // Handle specific error codes
    switch (error.status) {
      case HttpStatus.UNAUTHORIZED:
        return 'You need to log in to perform this action';
      case HttpStatus.FORBIDDEN:
        return 'You do not have permission to perform this action';
      case HttpStatus.NOT_FOUND:
        return 'The requested resource was not found';
      case HttpStatus.VALIDATION_ERROR:
        // Handle validation errors
        if (error.data?.errors) {
          const errorMessages = Object.values(error.data.errors).flat();
          return `Validation error: ${errorMessages.join(', ')}`;
        }
        return `Validation error: ${error.data?.message || 'Please check your input'}`;
      case HttpStatus.SERVER_ERROR:
        return 'The server encountered an error. Please try again later';
      default:
        return error.message || DEFAULT_ERROR_MESSAGES[error.status] || 'An unknown error occurred';
    }
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return 'An unknown error occurred';
  }
}

/**
 * Get a user-friendly error message based on the error
 * 
 * @param error The error object
 * @returns A user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  return handleApiError(error);
}

/**
 * Format an error into a standardized error response
 * 
 * @param error The error object
 * @returns A standardized error response
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof ApiError) {
    return {
      message: getErrorMessage(error),
      status: error.status,
      details: error.data,
    };
  } else if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name,
    };
  } else {
    return {
      message: getErrorMessage(error),
    };
  }
}

/**
 * Try to execute a function and handle any errors
 * 
 * @param fn The function to execute
 * @param fallback Optional fallback value to return if the function fails
 * @returns The result of the function or the fallback value
 */
export async function tryCatch<T>(fn: () => Promise<T>, fallback?: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('Error caught in tryCatch:', error);
    
    if (fallback !== undefined) {
      console.info('Using fallback value');
      return fallback;
    }
    
    throw error;
  }
}

/**
 * Attempts to handle an API error with fallback to mock data
 * 
 * @param apiCall - Function to call the API
 * @param mockDataFn - Function to get mock data
 * @param logPrefix - Prefix for console warning
 * @returns Promise resolving to API result or mock data
 */
export async function handleApiErrorWithMockFallback<T>(
  apiCall: () => Promise<T>,
  mockDataFn: () => T,
  logPrefix = 'API'
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || 
        (error instanceof ApiError && error.status === HttpStatus.NOT_FOUND)) {
      console.warn(`${logPrefix} request failed. Using mock data:`, error);
      return mockDataFn();
    }
    
    // For other errors, rethrow
    throw error;
  }
}

/**
 * Custom hook for displaying toast notifications
 * (placeholder - you can replace with your actual toast notification system)
 */
export function useErrorToast() {
  return {
    error: (message: string) => {
      console.error('Error Toast:', message);
      // Implement your toast notification here
    },
    success: (message: string) => {
      console.log('Success Toast:', message);
      // Implement your toast notification here
    }
  };
}
