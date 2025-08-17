import { useQuery } from '@tanstack/react-query';
import { fetchLowStockProducts, LowStockProduct, LowStockSummary } from '@/services/api';

export type { LowStockProduct, LowStockSummary };

/**
 * React Query hook for fetching low stock products
 * 
 * @param threshold - The stock threshold level (default: 10)
 * @returns Query result with products, summary, loading and error states
 */
export function useLowStock(threshold: number = 10) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['lowStockProducts', threshold],
    queryFn: () => fetchLowStockProducts(threshold),
    select: (response) => {
      if (!response.success) {
        throw new Error('Failed to fetch low stock products');
      }
      return response.data;
    },
  });

  return {
    products: data?.products || [],
    summary: data?.summary || null,
    loading: isLoading,
    isFetching, // Expose the isFetching state
    error: error instanceof Error ? error.message : null,
  };
}
