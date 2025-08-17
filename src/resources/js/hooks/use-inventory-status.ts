import { useQuery } from '@tanstack/react-query';
import { fetchInventoryStatus, InventoryStatusSummary } from '@/services/api';

export type { InventoryStatusSummary };

/**
 * React Query hook for fetching inventory status
 * 
 * @returns Query result with inventory status summary, loading and error states
 */
export function useInventoryStatus() {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['inventoryStatus'],
    queryFn: () => fetchInventoryStatus(),
    select: (response) => {
      if (response.status !== 'success') {
        throw new Error('Failed to fetch inventory status');
      }
      
      // Log the data to help with debugging
      console.log('Inventory Status API Response:', response.data);
      
      // Normalize the activities data structure to handle both formats
      if (response.data.recent_activities) {
        response.data.recent_activities = response.data.recent_activities.map(activity => {
          // Make sure we have a consistent structure regardless of API format
          if (!activity.product && activity.product_name) {
            // Convert old format to new format
            activity.product = {
              id: activity.id,
              name: activity.product_name
            };
          }
          return activity;
        });
      }
      
      return response.data;
    },
  });

  return {
    inventoryStatus: data || null,
    loading: isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
  };
}
