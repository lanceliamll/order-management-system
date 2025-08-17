// API request functions for products and inventory

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
