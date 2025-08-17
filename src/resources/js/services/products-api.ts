// API request functions for products

// Product Types
export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  status: string;
  message: string;
  data: Product[];
}

// Fetch all products
export async function fetchProducts(): Promise<ProductsResponse> {
  // For development/testing, return mock data
  return getMockProducts();
}

// Mock product data
function getMockProducts(): ProductsResponse {
  return {
    status: "success",
    message: "Products retrieved successfully",
    data: [
      {
        id: 1,
        name: "Ergonomic Keyboard",
        sku: "KB-ERG-001",
        description: "Ergonomic keyboard with wrist support",
        price: 89.99,
        stock_quantity: 45,
        created_at: "2025-08-01T08:00:00.000Z",
        updated_at: "2025-08-15T14:30:00.000Z"
      },
      {
        id: 2,
        name: "Wireless Mouse",
        sku: "MS-WL-002",
        description: "Wireless optical mouse with 1600 DPI",
        price: 29.99,
        stock_quantity: 78,
        created_at: "2025-08-01T08:00:00.000Z",
        updated_at: "2025-08-15T14:30:00.000Z"
      },
      {
        id: 3,
        name: "27\" Monitor",
        sku: "MN-27-003",
        description: "27-inch LED monitor with 4K resolution",
        price: 299.99,
        stock_quantity: 12,
        created_at: "2025-08-01T08:00:00.000Z",
        updated_at: "2025-08-15T14:30:00.000Z"
      },
      {
        id: 4,
        name: "USB-C Hub",
        sku: "HB-UC-004",
        description: "7-port USB-C hub with HDMI and Ethernet",
        price: 49.99,
        stock_quantity: 30,
        created_at: "2025-08-01T08:00:00.000Z",
        updated_at: "2025-08-15T14:30:00.000Z"
      },
      {
        id: 5,
        name: "Wireless Headphones",
        sku: "HP-WL-005",
        description: "Over-ear wireless headphones with noise cancellation",
        price: 149.99,
        stock_quantity: 8,
        created_at: "2025-08-01T08:00:00.000Z",
        updated_at: "2025-08-15T14:30:00.000Z"
      }
    ]
  };
}
