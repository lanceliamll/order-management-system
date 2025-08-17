import { useQuery } from '@tanstack/react-query';
import { fetchOrderSummary, type OrderSummary } from '@/services/api';

export type { OrderSummary };

interface UseOrderSummaryOptions {
  fromDate?: string;
  toDate?: string;
}

/**
 * React Query hook for fetching order summary
 * 
 * @param options - Options for filtering the order summary
 * @returns Query result with order summary data
 */
export function useOrderSummary(options: UseOrderSummaryOptions = {}) {
  const { fromDate, toDate } = options;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['orderSummary', { fromDate, toDate }],
    queryFn: () => fetchOrderSummary(fromDate, toDate),
    select: (response) => {
      if (response.status !== 'success') {
        throw new Error('Failed to fetch order summary');
      }
      return response.data;
    },
  });

  return {
    summary: data || null,
    loading: isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
  };
}
