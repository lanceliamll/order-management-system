/**
 * Product and inventory types
 */
import { ApiResponse } from '@/types/api';

/**
 * Product categories
 */
export const CATEGORIES = [
  'Computer Accessories',
  'Audio',
  'Video',
  'Office Supplies',
  'Storage',
  'Networking',
  'Peripherals',
  'Electronics'
];

/**
 * Product interface
 */
export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock_quantity: number;
  min_stock_threshold: number;
  category: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  is_active: boolean;
  cost?: number;
  reorder_point?: number;
  reorder_quantity?: number;
}

/**
 * Product detail interface (for edit/view)
 */
export interface ProductDetail extends Product {
  cost: number;
  reorder_point: number;
  reorder_quantity: number;
}

/**
 * Product list item interface (used for listings, with fewer fields)
 */
export interface ProductListItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category: string;
  is_active: boolean;
  reorder_point?: number;
}

/**
 * Stock status type
 */
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

/**
 * Inventory transaction types
 */
export type InventoryTransactionType = 
  | 'stock_in'
  | 'stock_out'
  | 'adjustment'
  | 'returned'
  | 'damaged'
  | 'initial';

/**
 * Inventory transaction interface
 */
export interface InventoryTransaction {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  transaction_type: InventoryTransactionType;
  quantity: number;
  previous_quantity: number;
  current_quantity: number;
  notes: string;
  created_by: number;
  created_at: string;
  reference?: string; // e.g., Order #123
}

/**
 * Inventory log (simplified version of transaction)
 */
export interface InventoryLog {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  reason: string;
  user_name: string;
  created_at: string;
}

/**
 * Product creation request
 */
export interface CreateProductRequest {
  name: string;
  sku: string;
  description: string;
  price: number;
  stock_quantity: number;
  min_stock_threshold: number;
  category: string;
  image_url?: string;
  is_active: boolean;
  cost?: number;
  reorder_point?: number;
  reorder_quantity?: number;
}

/**
 * Product update request
 */
export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

/**
 * Inventory adjustment request
 */
export interface AdjustInventoryRequest {
  product_id: number;
  quantity: number;
  transaction_type: InventoryTransactionType;
  notes: string;
  reference?: string;
}

/**
 * API response types
 */
export interface ProductsResponse extends ApiResponse<ProductListItem[]> {}
export interface ProductResponse extends ApiResponse<Product> {}
export interface InventoryTransactionsResponse extends ApiResponse<InventoryTransaction[]> {}
export interface InventoryLogsResponse extends ApiResponse<InventoryLog[]> {}

/**
 * Stock status helper
 */
export function getStockStatus(product: ProductListItem | Product): StockStatus {
  if (product.stock_quantity <= 0) {
    return 'out_of_stock';
  }
  
  if ('min_stock_threshold' in product) {
    if (product.stock_quantity <= (product as Product).min_stock_threshold) {
      return 'low_stock';
    }
  } else if (product.reorder_point && product.stock_quantity <= product.reorder_point) {
    return 'low_stock';
  } else if (product.stock_quantity <= 10) { // Default threshold
    return 'low_stock';
  }
  
  return 'in_stock';
}

/**
 * Format currency helper
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format date helper
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Product categories
 */
export const PRODUCT_CATEGORIES = [
  'Computer Accessories',
  'Audio',
  'Wearables',
  'Networking',
  'Storage',
  'Cables',
  'Displays',
  'Electronics',
  'Office Supplies',
  'Other'
];
