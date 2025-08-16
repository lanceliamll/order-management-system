# Order Management System API - Best Practices

This document outlines best practices for working with the Order Management System API, particularly focusing on inventory management, data integrity, and error handling.

## Database Transaction Best Practices

### When to Use Transactions

Always use database transactions for operations that:
- Modify multiple records
- Update inventory
- Change order status
- Process payments
- Involve multiple related tables

Example:
```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    // Multiple database operations here
    // All succeed or all fail
});
```

### Handling Concurrent Orders

The system uses row-level locking to prevent race conditions when updating inventory:

```php
// Lock the product row for exclusive update
$product = Product::where('id', $productId)
    ->lockForUpdate()
    ->first();
    
// Now you can safely update the product
$product->updateStock(-$quantity, $reason);
```

## Inventory Management Guidelines

### Preventing Negative Inventory

The system includes multiple validation checks to prevent negative inventory:
- Initial validation when adding items to cart
- Double-check validation at checkout
- Final validation after row locking before inventory deduction

### Inventory Logging

Every inventory change must be logged with:
- Change type (increase/decrease)
- Quantity changed
- Reason (order, return, adjustment)
- Reference to the related order (if applicable)

## Error Handling

### Common Error Scenarios

1. **Not Enough Stock**
   - Return 422 Validation Error
   - Include available quantity in the response

2. **Concurrent Update Conflicts**
   - Use row locking to prevent conflicts
   - Return clear error if stock changed during checkout

3. **Invalid Order Status Transitions**
   - Validate status changes (e.g., can't confirm a cancelled order)
   - Return 422 with specific error message

### Error Response Format

All API errors follow this format:
```json
{
  "status": "error",
  "message": "Human-readable error message",
  "errors": {
    "field_name": ["Specific validation errors"]
  }
}
```

## Order Cancellation Guidelines

### Full Cancellation

- Changes order status to 'cancelled'
- Restores inventory for confirmed orders
- Sets total_amount to 0
- Logs cancellation with previous and new totals

### Partial Cancellation

- Changes order status to 'partially_cancelled'
- Updates cancelled_quantity for specific items
- Restores inventory proportionally
- Recalculates order total based on active items
- Logs details of which items were cancelled

## Performance Considerations

### Database Indexes

Ensure these fields are indexed:
- order_items.order_id
- order_items.product_id
- orders.status
- inventory_logs.product_id
- order_logs.order_id

### Query Optimization

- Use eager loading to prevent N+1 query problems
- For example: `Order::with('orderItems.product')`

## Security Best Practices

### Input Validation

All endpoints use Form Request validation with:
- Type checking (integer, string, etc.)
- Range validation (min, max)
- Relationship validation (exists)
- Custom validation rules for business logic

### Authorization

- Use Laravel Sanctum for API authentication
- Implement proper authorization checks in controllers/requests
- Log all sensitive operations for audit trail

## Testing Guidelines

### Test Edge Cases

Always test these scenarios:
- Concurrent order processing
- Cancelling already cancelled orders
- Confirming orders with insufficient stock
- API request validation errors

### Mocking External Dependencies

When testing, mock:
- Payment gateways
- External inventory systems
- Notification services

## Monitoring and Debugging

### Activity Logging

The system logs all significant activities:
- Order creation, confirmation, cancellation
- Inventory changes
- Status transitions

### Troubleshooting Tools

Endpoints available for debugging:
- `/api/orders/{id}/activity` - Order activity logs
- `/api/products/{id}/inventory-logs` - Product inventory logs
- `/api/reports/activities` - System-wide activity timeline
