import { useState as useStateReact } from 'react';

interface UseLoadingStateReturn {
  loading: boolean;
  error: string | null;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export function useLoadingState(initialLoading = false): UseLoadingStateReturn {
  const [loading, setLoading] = useStateReact<boolean>(initialLoading);
  const [error, setError] = useStateReact<string | null>(null);

  const clearError = () => setError(null);

  return {
    loading,
    error,
    setLoading,
    setError,
    clearError
  };
}

export default useLoadingState;
