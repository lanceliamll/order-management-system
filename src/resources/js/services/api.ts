// API request functions for products and inventory

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
 * @param threshold - Stock level threshold (default: 10)
 */
export async function fetchLowStockProducts(threshold: number = 10): Promise<LowStockResponse> {
  const response = await fetch(`/products/inventory/low-stock?threshold=${threshold}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch low stock products: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch summary of orders from the API
 * @param fromDate - Optional start date (YYYY-MM-DD)
 * @param toDate - Optional end date (YYYY-MM-DD)
 */
export async function fetchOrderSummary(fromDate?: string, toDate?: string): Promise<OrderSummaryResponse> {
  // Build the query parameters if dates are provided
  const params = new URLSearchParams();
  if (fromDate) params.append('from_date', fromDate);
  if (toDate) params.append('to_date', toDate);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/reports/orders/summary${queryString}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch order summary: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // For now, if the API isn't implemented yet, fallback to mock data
  if (response.status === 404) {
    console.warn('Order summary API endpoint not found. Using mock data.');
    return getMockOrderSummary();
  }
  
  return data;
}

/**
 * Provides mock order summary data for development purposes
 */
function getMockOrderSummary(): OrderSummaryResponse {
  return {
    status: "success",
    data: {
      summary_by_status: [
        {
          status: "pending",
          count: 38,
          total_amount: 3800.50
        },
        {
          status: "confirmed",
          count: 153,
          total_amount: 15342.75
        },
        {
          status: "delivered",
          count: 1051,
          total_amount: 105124.30
        },
        {
          status: "cancelled",
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
  const response = await fetch('/api/reports/inventory/status');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory status: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // For now, if the API isn't implemented yet, fallback to mock data
  if (response.status === 404) {
    console.warn('Inventory status API endpoint not found. Using mock data.');
    return getMockInventoryStatus();
  }
  
  return data;
}

/**
 * Provides mock inventory status data for development purposes
 */
function getMockInventoryStatus(): InventoryStatusResponse {
  return {
    status: "success",
    data: {
      total_products: 450,
      total_inventory_value: 185250.00,
      low_stock_count: 18,
      out_of_stock_count: 7,
      low_stock_threshold: 10,
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
          type: "stock_in",
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
          type: "stock_out",
          quantity_change: -5,
          timestamp: "2025-08-16T10:15:00.000Z",
          notes: "Order #12345"
        }
      ]
    }
  };
}
