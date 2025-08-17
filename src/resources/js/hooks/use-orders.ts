import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchOrders, 
  fetchOrderById, 
  createOrder, 
  confirmOrder, 
  cancelOrder, 
  cancelOrderItems,
  type Order,
  type CreateOrderRequest,
  type CancelOrderItemsRequest
} from '@/services/orders-api';

export type { Order };

/**
 * React Query hook for fetching all orders
 */
export function useOrders() {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrders(),
    select: (response) => {
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to fetch orders');
      }
      return response.data;
    },
  });

  return {
    orders: data || [],
    loading: isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * React Query hook for fetching a single order by ID
 */
export function useOrder(id: number) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrderById(id),
    select: (response) => {
      if (response.status !== 'success') {
        throw new Error(response.message || `Failed to fetch order #${id}`);
      }
      return response.data;
    },
    enabled: !!id, // Only run query if id is provided
  });

  return {
    order: data || null,
    loading: isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * React Query hook for creating a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (orderData: CreateOrderRequest) => createOrder(orderData),
    onSuccess: () => {
      // Invalidate orders cache so it refetches
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    createOrder: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
    isSuccess: mutation.isSuccess,
    data: mutation.data?.data,
  };
}

/**
 * React Query hook for confirming an order
 */
export function useConfirmOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (orderId: number) => confirmOrder(orderId),
    onSuccess: (_, orderId) => {
      // Invalidate specific order and orders list
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    confirmOrder: mutation.mutate,
    isConfirming: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
    isSuccess: mutation.isSuccess,
  };
}

/**
 * React Query hook for cancelling an entire order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (orderId: number) => cancelOrder(orderId),
    onSuccess: (_, orderId) => {
      // Invalidate specific order and orders list
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    cancelOrder: mutation.mutate,
    isCancelling: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
    isSuccess: mutation.isSuccess,
  };
}

/**
 * React Query hook for cancelling specific items in an order
 */
export function useCancelOrderItems() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ orderId, items }: { orderId: number; items: CancelOrderItemsRequest }) => 
      cancelOrderItems(orderId, items),
    onSuccess: (_, variables) => {
      // Invalidate specific order and orders list
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    cancelItems: mutation.mutate,
    isCancelling: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
    isSuccess: mutation.isSuccess,
  };
}
