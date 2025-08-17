import { useState, useCallback } from 'react';
import { formatErrorResponse } from '@/services/errorHandler';

/**
 * Status of an async operation
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * State for an async operation
 */
export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
}

/**
 * Options for the useAsync hook
 */
export interface UseAsyncOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: Error | string) => void;
}

/**
 * Custom hook for handling async operations with loading, success, and error states
 * 
 * @param asyncFunction The async function to execute
 * @param options Hook options
 * @returns State and execution functions for the async operation
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const { initialData = null, onSuccess, onError } = options;
  
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: initialData,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    isIdle: true,
  });

  const [isFetching, setIsFetching] = useState(false);
  
  // Execute the async function
  const execute = useCallback(async () => {
    setIsFetching(true);
    setState({
      status: 'loading',
      data: state.data, // Keep any existing data
      error: null,
      isLoading: true,
      isError: false,
      isSuccess: false,
      isIdle: false,
    });
    
    try {
      const data = await asyncFunction();
      setState({
        status: 'success',
        data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isIdle: false,
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      return data;
    } catch (error) {
      const errorResponse = formatErrorResponse(error);
      setState({
        status: 'error',
        data: null,
        error: errorResponse.message,
        isLoading: false,
        isError: true,
        isSuccess: false,
        isIdle: false,
      });
      
      if (onError) {
        onError(errorResponse.message);
      }
      
      throw error;
    } finally {
      setIsFetching(false);
    }
  }, [asyncFunction, onSuccess, onError, state.data]);
  
  // Reset the state
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      data: initialData,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
    });
  }, [initialData]);
  
  return {
    ...state,
    execute,
    reset,
    isFetching,
  };
}
