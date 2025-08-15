# Orders API Quickstart Guide

This guide provides a quick reference for using the Orders API in the Order Management System.

## Authentication

All API requests need to include an authentication token. Use the following header:

```
Authorization: Bearer YOUR_API_TOKEN
```

## Basic Usage

### Create a New Order

```bash
# Create a new order with multiple products
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "products": [
      {
        "product_id": 1,
        "quantity": 2
      },
      {
        "product_id": 3,
        "quantity": 1
      }
    ]
  }'
```

### Get All Orders

```bash
# Retrieve all orders
curl -X GET http://localhost:8000/api/orders \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Get Order Details

```bash
# Get a specific order by ID
curl -X GET http://localhost:8000/api/orders/1 \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Confirm an Order

```bash
# Confirm an order (which deducts inventory)
curl -X PUT http://localhost:8000/api/orders/1/confirm \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Cancel an Entire Order

```bash
# Cancel an entire order (restores inventory if the order was confirmed)
curl -X PUT http://localhost:8000/api/orders/1/cancel \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Cancel Specific Items (Partial Cancellation)

```bash
# Cancel specific items in an order
curl -X PUT http://localhost:8000/api/orders/1/cancel-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "items": [
      {
        "order_item_id": 1,
        "quantity": 1
      }
    ]
  }'
```

## Order Process Flow

1. **Create Order**: Submit products and quantities to create a new order (status: pending)
2. **Confirm Order**: Confirm the order to deduct inventory (status: confirmed)
3. **Cancel Order**: 
   - Cancel entire order (status: cancelled) 
   - Or cancel specific items (status: partially_cancelled)

## Response Format

All API responses follow this format:

```json
{
  "status": "success",
  "message": "Operation successful message",
  "data": {
    // Response data here
  }
}
```

For errors:

```json
{
  "status": "error",
  "message": "Error message",
  "errors": {
    // Validation errors if applicable
  }
}
```

## Notes

- Inventory is automatically deducted when an order is confirmed
- Order total is calculated automatically based on product prices and quantities
- Once an order is confirmed, it cannot be cancelled
- Each order is assigned a unique order number (format: ORD-YYYYMMDD-XXXXXX)

For more detailed information, see the [complete Orders API documentation](orders-api.md).
