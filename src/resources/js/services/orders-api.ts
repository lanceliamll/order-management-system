// API request functions for order management
import { get, post, put } from './apiClient';
import { handleApiErrorWithMockFallback } from './errorHandler';
import { API_ENDPOINTS, ORDER_STATUS, STATUS_CODES } from '@/config/api.config';

// Order Types
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  cancelled_quantity?: number;
}

export interface Order {
  id: number;
  order_number: string; // format: ORD-YYYYMMDD-XXXXXX
  status: typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

// API Request Types
export interface CreateOrderItem {
  product_id: number;
  quantity: number;
}

export interface CreateOrderRequest {
  products: CreateOrderItem[];
}

export interface CancelOrderItemRequest {
  order_item_id: number;
  quantity: number;
}

export interface CancelOrderItemsRequest {
  items: CancelOrderItemRequest[];
}

// API Response Types
export interface OrdersResponse {
  status: string;
  message: string;
  data: Order[];
}

export interface OrderResponse {
  status: string;
  message: string;
  data: Order;
}

/**
 * Fetch all orders from the API
 */
export async function fetchOrders(): Promise<OrdersResponse> {
  try {
    return await get<OrdersResponse>(API_ENDPOINTS.ORDERS.BASE);
  } catch (error) {
    return handleApiErrorWithMockFallback(
      () => Promise.reject(error),
      getMockOrders,
      'Orders API'
    );
  }
}

/**
 * Fetch a single order by ID
 * @param id Order ID to fetch
 */
export async function fetchOrderById(id: number): Promise<OrderResponse> {
  try {
    return await get<OrderResponse>(API_ENDPOINTS.ORDERS.DETAIL(id));
  } catch (error) {
    return handleApiErrorWithMockFallback(
      () => Promise.reject(error),
      () => getMockOrderById(id),
      'Order API'
    );
  }
}

/**
 * Create a new order
 * @param orderData Order data with products and quantities
 */
export async function createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
  try {
    return await post<OrderResponse>(API_ENDPOINTS.ORDERS.BASE, orderData);
  } catch (error) {
    // We don't use mock fallback here since creating an order should fail properly
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Confirm an order
 * @param id Order ID to confirm
 */
export async function confirmOrder(id: number): Promise<OrderResponse> {
  try {
    return await put<OrderResponse>(API_ENDPOINTS.ORDERS.CONFIRM(id));
  } catch (error) {
    console.error(`Error confirming order #${id}:`, error);
    throw error;
  }
}

/**
 * Cancel an entire order
 * @param id Order ID to cancel
 */
export async function cancelOrder(id: number): Promise<OrderResponse> {
  try {
    return await put<OrderResponse>(API_ENDPOINTS.ORDERS.CANCEL(id));
  } catch (error) {
    console.error(`Error cancelling order #${id}:`, error);
    throw error;
  }
}

/**
 * Cancel specific items in an order
 * @param id Order ID
 * @param items Items to cancel
 */
export async function cancelOrderItems(id: number, items: CancelOrderItemsRequest): Promise<OrderResponse> {
  try {
    return await put<OrderResponse>(API_ENDPOINTS.ORDERS.CANCEL_ITEMS(id), items);
  } catch (error) {
    console.error(`Error cancelling items in order #${id}:`, error);
    throw error;
  }
}

/**
 * Provides mock orders data for development purposes
 */
function getMockOrders(): OrdersResponse {
  return {
    status: STATUS_CODES.SUCCESS,
    message: "Orders retrieved successfully",
    data: [
      {
        id: 1,
        order_number: "ORD-20250815-000001",
        status: ORDER_STATUS.CONFIRMED,
        total_amount: 259.98,
        created_at: "2025-08-15T09:30:00.000Z",
        updated_at: "2025-08-15T09:35:00.000Z",
        items: [
          {
            id: 1,
            order_id: 1,
            product_id: 1,
            product_name: "Premium Headphones",
            product_sku: "HDPH-001",
            quantity: 2,
            unit_price: 129.99,
            total_price: 259.98,
          }
        ]
      },
      {
        id: 2,
        order_number: "ORD-20250816-000002",
        status: ORDER_STATUS.PENDING,
        total_amount: 89.99,
        created_at: "2025-08-16T14:45:00.000Z",
        updated_at: "2025-08-16T14:45:00.000Z",
        items: [
          {
            id: 2,
            order_id: 2,
            product_id: 2,
            product_name: "Wireless Keyboard",
            product_sku: "KBRD-002",
            quantity: 1,
            unit_price: 89.99,
            total_price: 89.99
          }
        ]
      },
      {
        id: 3,
        order_number: "ORD-20250816-000003",
        status: "partially_cancelled",
        total_amount: 429.98,
        created_at: "2025-08-16T16:20:00.000Z",
        updated_at: "2025-08-16T17:15:00.000Z",
        items: [
          {
            id: 3,
            order_id: 3,
            product_id: 1,
            product_name: "Premium Headphones",
            product_sku: "HDPH-001",
            quantity: 2,
            unit_price: 129.99,
            total_price: 259.98,
            cancelled_quantity: 1
          },
          {
            id: 4,
            order_id: 3,
            product_id: 3,
            product_name: "Smart Watch Series 5",
            product_sku: "WTCH-003",
            quantity: 1,
            unit_price: 299.99,
            total_price: 299.99
          }
        ]
      },
      {
        id: 4,
        order_number: "ORD-20250817-000004",
        status: "cancelled",
        total_amount: 599.98,
        created_at: "2025-08-17T10:00:00.000Z",
        updated_at: "2025-08-17T10:30:00.000Z",
        items: [
          {
            id: 5,
            order_id: 4,
            product_id: 3,
            product_name: "Smart Watch Series 5",
            product_sku: "WTCH-003",
            quantity: 2,
            unit_price: 299.99,
            total_price: 599.98,
            cancelled_quantity: 2
          }
        ]
      }
    ]
  };
}

/**
 * Provides mock order data for development purposes
 */
function getMockOrderById(id: number): OrderResponse {
  const orders = getMockOrders();
  const order = orders.data.find(order => order.id === id);
  
  if (!order) {
    return {
      status: "error",
      message: `Order #${id} not found`,
      data: {} as Order
    };
  }
  
  return {
    status: "success",
    message: "Order retrieved successfully",
    data: order
  };
}
