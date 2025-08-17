/**
 * Common API response types
 * 
 * This file contains common API response types that are used across the application.
 * By centralizing these types, we can ensure consistency and reduce duplication.
 */
import { STATUS_CODES } from '@/config/api.config';

/**
 * Base API response interface
 */
export interface ApiResponse<T = any> {
  status: typeof STATUS_CODES[keyof typeof STATUS_CODES];
  message: string;
  data: T;
}

/**
 * Paginated API response interface
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<{
  items: T[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}> {}

/**
 * Error response interface
 */
export interface ApiErrorResponse {
  status: typeof STATUS_CODES.ERROR;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Type guard to check if a response is an error
 */
export function isApiErrorResponse(response: any): response is ApiErrorResponse {
  return response?.status === STATUS_CODES.ERROR;
}

/**
 * Type guard to check if a response is successful
 */
export function isApiSuccessResponse<T>(response: any): response is ApiResponse<T> {
  return response?.status === STATUS_CODES.SUCCESS;
}
