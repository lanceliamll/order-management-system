/**
 * API Configuration
 * 
 * This file contains all API endpoints, parameter names, and other constants
 * used throughout the application. Using this centralized configuration makes
 * it easier to update values across the app and increases maintainability.
 */

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Products and Inventory
  PRODUCTS: {
    LOW_STOCK: '/products/inventory/low-stock',
    DETAIL: (id: number) => `/products/${id}`,
    BASE: '/products',
  },
  
  // Orders
  ORDERS: {
    BASE: '/orders',
    DETAIL: (id: number) => `/orders/${id}`,
    CONFIRM: (id: number) => `/orders/${id}/confirm`,
    CANCEL: (id: number) => `/orders/${id}/cancel`,
    CANCEL_ITEMS: (id: number) => `/orders/${id}/cancel-items`,
    SUMMARY: '/orders/summary',
  },
  
  // Reports
  REPORTS: {
    ORDER_SUMMARY: '/reports/orders/summary',
    INVENTORY_STATUS: '/reports/inventory/status',
    SALES: '/reports/sales',
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
  },
};

/**
 * API Parameter Names
 * 
 * These are the parameter names expected by the API
 */
export const API_PARAMS = {
  // Date ranges
  DATE_RANGE: {
    FROM: 'from_date',
    TO: 'to_date',
  },
  
  // Pagination
  PAGINATION: {
    PAGE: 'page',
    LIMIT: 'limit',
    SORT: 'sort',
    DIRECTION: 'direction',
  },
  
  // Filters
  FILTERS: {
    STATUS: 'status',
    SEARCH: 'query',
    CATEGORY: 'category',
    THRESHOLD: 'threshold',
  },
};

/**
 * Default values
 */
export const DEFAULT_VALUES = {
  PAGINATION: {
    LIMIT: 10,
    PAGE: 1,
  },
  
  INVENTORY: {
    LOW_STOCK_THRESHOLD: 10,
  },
  
  DATE_FORMAT: 'YYYY-MM-DD',
};

/**
 * Status code constants
 */
export const STATUS_CODES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Order status constants
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DELIVERED: 'delivered', 
  CANCELLED: 'cancelled',
  PARTIALLY_CANCELLED: 'partially_cancelled',
};

/**
 * Inventory activity types
 */
export const INVENTORY_ACTIVITY_TYPES = {
  STOCK_IN: 'stock_in',
  STOCK_OUT: 'stock_out',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
  DAMAGED: 'damaged',
};
