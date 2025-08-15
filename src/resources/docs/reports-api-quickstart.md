# Reports API Quick Start Guide

This guide provides a quick overview of how to use the Reports API in the Order Management System.

## Available Reports

The Reports API provides several endpoints for business intelligence and monitoring:

1. **Order Summary Report** - Aggregated order statistics
2. **Inventory Status Report** - Current inventory levels and alerts
3. **Revenue Report** - Financial analytics by time period
4. **Activity Timeline** - Audit logs for orders and inventory

## Authentication

All API endpoints require authentication. Include your API token in the request header:

```
Authorization: Bearer YOUR_API_TOKEN
```

## Basic Usage

### Order Summary Report

Get a summary of orders by status with totals:

```
GET /api/reports/orders/summary
```

Optional filters:
- `from_date` - Start date (YYYY-MM-DD)
- `to_date` - End date (YYYY-MM-DD)

Example response:
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
    "recent_orders": [...]
  }
}
```

### Inventory Status Report

Get current inventory levels and alerts:

```
GET /api/reports/inventory/status
```

Example response:
```json
{
  "status": "success",
  "data": {
    "total_products": 50,
    "total_inventory_value": 25000.00,
    "low_stock_count": 5,
    "out_of_stock_count": 2,
    "low_stock_threshold": 10,
    "low_stock_products": [...],
    "recent_activities": [...]
  }
}
```

### Revenue Report

Get revenue analytics by time period:

```
GET /api/reports/revenue
```

Optional parameters:
- `period` - 'daily' or 'monthly' (default: 'monthly')
- `year` - Year to analyze (default: current year)
- `month` - Month to analyze, required for daily reports (default: current month)

Example response:
```json
{
  "status": "success",
  "data": {
    "period": "monthly",
    "period_label": "Month",
    "period_data": [...],
    "total_revenue": 11300.00,
    "total_orders": 55,
    "top_products": [...]
  }
}
```

### Activity Timeline

Get activity logs for orders or inventory:

```
GET /api/reports/activities
```

Optional parameters:
- `type` - 'order' or 'inventory' (default: 'order')
- `id` - Filter by specific order_id or product_id
- `limit` - Maximum number of results (default: 20)

Example response:
```json
{
  "status": "success",
  "data": {
    "type": "order",
    "activities": [...]
  }
}
```

## Item-Specific Logs

For detailed logs about specific items:

### Product Inventory Logs

```
GET /api/products/{id}/inventory-logs
```

### Order Activity Logs

```
GET /api/orders/{id}/activity
```

## Need More Information?

For detailed documentation including all parameters and response formats, see the [Reports API: Complete Documentation](reports-api.md).
