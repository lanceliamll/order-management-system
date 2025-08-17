// API request functions for products and inventory
import { get } from './apiClient';
import { handleApiErrorWithMockFallback } from './errorHandler';
import { 
  API_ENDPOINTS, 
  API_PARAMS, 
  DEFAULT_VALUES, 
  STATUS_CODES,
  ORDER_STATUS,
  INVENTORY_ACTIVITY_TYPES
} from '@/config/api.config';

// Low Stock Products Types
export interface LowStockProduct {
  id: number;
  name: string;
  stock_quantity: number;
  price: number;
  inventory_value: number;
}

export interface LowStockSummary {
  low_stock_count: number;
  out_of_stock_count: number;
  threshold_used: number;
  total_value_at_risk: number;
}

export interface LowStockResponse {
  success: boolean;
  data: {
    products: LowStockProduct[];
    summary: LowStockSummary;
  };
}

// Inventory Status Types
export interface InventoryActivity {
  id: number;
  product_name?: string; // From mock data
  product?: {
    id: number;
    name: string;
    sku?: string;
  }; // From actual API
  type: string;
  timestamp: string;
  quantity_change: number;
  notes?: string;
  updated_at?: string; // New field for updated timestamp
}

export interface InventoryStatusSummary {
  total_products: number;
  total_inventory_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  low_stock_threshold: number;
  low_stock_products: LowStockProduct[];
  recent_activities: InventoryActivity[];
}

export interface InventoryStatusResponse {
  status: string;
  data: InventoryStatusSummary;
}

// Order Summary Types
export interface OrderStatus {
  status: string;
  count: number;
  total_amount: number;
}

export interface OrderSummary {
  summary_by_status: OrderStatus[];
  total_orders: number;
  total_revenue: number;
  recent_orders: any[]; // We'll keep this as any[] for now since the structure isn't fully specified
}

export interface OrderSummaryResponse {
  status: string;
  data: OrderSummary;
}

/**
 * Fetch products with stock levels below a specified threshold
 * @param threshold - Stock level threshold (default: from config)
 */
export async function fetchLowStockProducts(threshold: number = DEFAULT_VALUES.INVENTORY.LOW_STOCK_THRESHOLD): Promise<LowStockResponse> {
  try {
    return await get<LowStockResponse>(API_ENDPOINTS.PRODUCTS.LOW_STOCK, {
      params: { [API_PARAMS.FILTERS.THRESHOLD]: threshold }
    });
  } catch (error) {
    // Create mock data function
    const getMockLowStockProducts = (): LowStockResponse => {
      return {
        success: true,
        data: {
          products: [],
          summary: {
            low_stock_count: 0,
            out_of_stock_count: 0,
            threshold_used: threshold,
            total_value_at_risk: 0
          }
        }
      };
    };
    
    return handleApiErrorWithMockFallback(
      () => Promise.reject(error), 
      getMockLowStockProducts, 
      'Low stock products API'
    );
  }
}

/**
 * Fetch summary of orders from the API
 * @param fromDate - Optional start date (YYYY-MM-DD)
 * @param toDate - Optional end date (YYYY-MM-DD)
 */
export async function fetchOrderSummary(fromDate?: string, toDate?: string): Promise<OrderSummaryResponse> {
  try {
    // Use our new API client with params object
    return await get<OrderSummaryResponse>(API_ENDPOINTS.REPORTS.ORDER_SUMMARY, {
      params: {
        [API_PARAMS.DATE_RANGE.FROM]: fromDate,
        [API_PARAMS.DATE_RANGE.TO]: toDate
      }
    });
  } catch (error) {
    // Use our error handler with mock fallback
    return handleApiErrorWithMockFallback(
      () => Promise.reject(error), 
      getMockOrderSummary, 
      'Order summary API'
    );
  }
}

/**
 * Provides mock order summary data for development purposes
 */
function getMockOrderSummary(): OrderSummaryResponse {
  return {
    status: STATUS_CODES.SUCCESS,
    data: {
      summary_by_status: [
        {
          status: ORDER_STATUS.PENDING,
          count: 38,
          total_amount: 3800.50
        },
        {
          status: ORDER_STATUS.CONFIRMED,
          count: 153,
          total_amount: 15342.75
        },
        {
          status: ORDER_STATUS.DELIVERED,
          count: 1051,
          total_amount: 105124.30
        },
        {
          status: ORDER_STATUS.CANCELLED,
          count: 45,
          total_amount: 4478.40
        }
      ],
      total_orders: 1287,
      total_revenue: 128745.95,
      recent_orders: [] // Mock empty for now
    }
  };
}

/**
 * Fetch inventory status from the API
 */
export async function fetchInventoryStatus(): Promise<InventoryStatusResponse> {
  try {
    return await get<InventoryStatusResponse>(API_ENDPOINTS.REPORTS.INVENTORY_STATUS);
  } catch (error) {
    return handleApiErrorWithMockFallback(
      () => Promise.reject(error),
      getMockInventoryStatus,
      'Inventory status API'
    );
  }
}

/**
 * Provides mock inventory status data for development purposes
 */
function getMockInventoryStatus(): InventoryStatusResponse {
  return {
    status: STATUS_CODES.SUCCESS,
    data: {
      total_products: 450,
      total_inventory_value: 185250.00,
      low_stock_count: 18,
      out_of_stock_count: 7,
      low_stock_threshold: DEFAULT_VALUES.INVENTORY.LOW_STOCK_THRESHOLD,
      low_stock_products: [
        {
          id: 1,
          name: "Premium Headphones",
          stock_quantity: 5,
          price: 129.99,
          inventory_value: 649.95
        },
        {
          id: 2,
          name: "Wireless Keyboard",
          stock_quantity: 8,
          price: 89.99,
          inventory_value: 719.92
        },
        {
          id: 3,
          name: "Smart Watch Series 5",
          stock_quantity: 0,
          price: 299.99,
          inventory_value: 0
        }
      ],
      recent_activities: [
        {
          id: 1,
          product: {
            id: 5,
            name: "Bluetooth Speaker",
            sku: "SPKR-001"
          },
          type: INVENTORY_ACTIVITY_TYPES.STOCK_IN,
          quantity_change: 25,
          timestamp: "2025-08-16T14:30:00.000Z",
          notes: "Regular stock replenishment"
        },
        {
          id: 2,
          product: {
            id: 1,
            name: "Premium Headphones",
            sku: "HDPH-001"
          },
          type: INVENTORY_ACTIVITY_TYPES.STOCK_OUT,
          quantity_change: -5,
          timestamp: "2025-08-16T10:15:00.000Z",
          notes: "Order #12345"
        }
      ]
    }
  };
}
