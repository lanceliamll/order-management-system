# Reports API Documentation

This documentation describes the Reports API which provides endpoints for retrieving various types of reports and logs related to orders, inventory, revenue, and system activities.

## Base URL

All API endpoints are relative to `/api/reports/`.

## Available Endpoints

### Order Summary Report

Provides a summary of orders, including counts and totals by status.

- **URL**: `/orders/summary`
- **Method**: `GET`
- **Query Parameters**:
  - `from_date` (optional): Filter from this date (YYYY-MM-DD)
  - `to_date` (optional): Filter to this date (YYYY-MM-DD). Defaults to current date.

**Response Example**:
```json
{
  "status": "success",
  "data": {
    "summary_by_status": [
      {
        "status": "pending",
        "count": 10,
        "total_amount": 2500.00
      },
      {
        "status": "confirmed",
        "count": 15,
        "total_amount": 3750.00
      }
    ],
    "total_orders": 25,
    "total_revenue": 6250.00,
    "recent_orders": [
      {
        "id": 1,
        "order_number": "ORD-2023-00001",
        "status": "confirmed",
        "total_amount": 250.00,
        "created_at": "2023-08-15T14:30:00",
        "updated_at": "2023-08-15T15:00:00",
        "orderItems": [
          {
            "id": 1,
            "order_id": 1,
            "product_id": 2,
            "quantity": 5,
            "unit_price": 50.00
          }
        ]
      }
    ]
  }
}
```

### Inventory Status Report

Provides an overview of current inventory status, including low stock items.

- **URL**: `/inventory/status`
- **Method**: `GET`

**Response Example**:
```json
{
  "status": "success",
  "data": {
    "total_products": 50,
    "total_inventory_value": 25000.00,
    "low_stock_count": 5,
    "out_of_stock_count": 2,
    "low_stock_threshold": 10,
    "low_stock_products": [
      {
        "id": 3,
        "name": "Product A",
        "stock_quantity": 5,
        "price": 45.00
      }
    ],
    "recent_activities": [
      {
        "id": 1,
        "product_name": "Product A",
        "change_type": "decrease",
        "quantity_change": -5,
        "reason": "order_confirmed",
        "date": "2023-08-15 14:30:00"
      }
    ]
  }
}
```

### Revenue Report

Provides revenue calculations by day or month.

- **URL**: `/revenue`
- **Method**: `GET`
- **Query Parameters**:
  - `period` (optional): 'daily' or 'monthly'. Defaults to 'monthly'.
  - `year` (optional): Filter by year (YYYY). Defaults to current year.
  - `month` (optional): Filter by month (1-12). Required when period is 'daily'.

**Response Example**:
```json
{
  "status": "success",
  "data": {
    "period": "monthly",
    "period_label": "Month",
    "period_data": [
      {
        "period": "2023-01",
        "total_revenue": 5200.00,
        "order_count": 25
      },
      {
        "period": "2023-02",
        "total_revenue": 6100.00,
        "order_count": 30
      }
    ],
    "total_revenue": 11300.00,
    "total_orders": 55,
    "top_products": [
      {
        "id": 3,
        "name": "Product A",
        "revenue": 2500.00,
        "units_sold": 50
      }
    ]
  }
}
```

### Activity Timeline

Provides a timeline of activities for orders or products.

- **URL**: `/activities`
- **Method**: `GET`
- **Query Parameters**:
  - `type` (optional): 'order' or 'inventory'. Defaults to 'order'.
  - `id` (optional): Filter by specific order_id or product_id.
  - `limit` (optional): Limit number of results. Defaults to 20.

**Response Example**:
```json
{
  "status": "success",
  "data": {
    "type": "order",
    "activities": [
      {
        "id": 1,
        "order_number": "ORD-2023-00001",
        "activity_type": "created",
        "details": {
          "total_amount": 250.00,
          "items_count": 2
        },
        "date": "2023-08-15 14:30:00",
        "user_id": null
      }
    ]
  }
}
```

## Item-Specific Logs

Besides the reporting endpoints, there are also endpoints to get logs for specific items:

### Product Inventory Logs

Retrieves inventory change logs for a specific product.

- **URL**: `/products/{id}/inventory-logs`
- **Method**: `GET`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Product A",
      "current_stock": 25
    },
    "logs": [
      {
        "id": 1,
        "product_id": 1,
        "change_type": "increase",
        "quantity_change": 10,
        "reason": "manual_adjustment",
        "created_at": "2023-08-15 14:30:00",
        "updated_at": "2023-08-15 14:30:00"
      }
    ]
  }
}
```

### Order Activity Logs

Retrieves activity logs for a specific order.

- **URL**: `/orders/{id}/activity`
- **Method**: `GET`

**Response Example**:
```json
{
  "status": "success",
  "data": {
    "order": {
      "id": 1,
      "order_number": "ORD-2023-00001",
      "status": "confirmed",
      "total_amount": 250.00
    },
    "logs": [
      {
        "id": 1,
        "order_id": 1,
        "activity_type": "created",
        "details": {
          "total_amount": 250.00,
          "items_count": 2
        },
        "created_at": "2023-08-15 14:30:00",
        "updated_at": "2023-08-15 14:30:00",
        "user_id": null
      }
    ]
  }
}
```
