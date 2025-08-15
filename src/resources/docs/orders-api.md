# Order Management System: Orders API Documentation

This documentation provides details on how to use the Orders API for managing orders in the Order Management System.

## Base URL

All API endpoints are prefixed with `/api/orders`.

## Authentication

Authentication is handled via Laravel Sanctum. Include your API token in the request header:

```
Authorization: Bearer YOUR_API_TOKEN
```

## Endpoints

### List all orders

Retrieves a list of all orders.

- **URL**: `/api/orders`
- **Method**: `GET`
- **Response**:
  - Status: 200 OK
  - Body:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 1,
          "order_number": "ORD-20250815-A1B2C3",
          "status": "pending",
          "total_amount": "150.00",
          "created_at": "2025-08-15T10:00:00.000000Z",
          "updated_at": "2025-08-15T10:00:00.000000Z",
          "order_items": [
            {
              "id": 1,
              "order_id": 1,
              "product_id": 2,
              "quantity": 3,
              "unit_price": "50.00",
              "created_at": "2025-08-15T10:00:00.000000Z",
              "updated_at": "2025-08-15T10:00:00.000000Z"
            }
          ]
        }
      ]
    }
    ```

### Create a new order

Creates a new order with the specified products.

- **URL**: `/api/orders`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
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
  }
  ```
- **Response**:
  - Status: 201 Created
  - Body:
    ```json
    {
      "status": "success",
      "message": "Order created successfully",
      "data": {
        "order": {
          "id": 1,
          "order_number": "ORD-20250815-A1B2C3",
          "status": "pending",
          "total_amount": "175.00",
          "created_at": "2025-08-15T10:00:00.000000Z",
          "updated_at": "2025-08-15T10:00:00.000000Z",
          "order_items": [
            {
              "id": 1,
              "order_id": 1,
              "product_id": 1,
              "quantity": 2,
              "unit_price": "75.00",
              "created_at": "2025-08-15T10:00:00.000000Z",
              "updated_at": "2025-08-15T10:00:00.000000Z"
            },
            {
              "id": 2,
              "order_id": 1,
              "product_id": 3,
              "quantity": 1,
              "unit_price": "25.00",
              "created_at": "2025-08-15T10:00:00.000000Z",
              "updated_at": "2025-08-15T10:00:00.000000Z"
            }
          ]
        }
      }
    }
    ```

### Get order details

Retrieves the details of a specific order.

- **URL**: `/api/orders/{id}`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: The ID of the order to retrieve
- **Response**:
  - Status: 200 OK
  - Body:
    ```json
    {
      "status": "success",
      "data": {
        "id": 1,
        "order_number": "ORD-20250815-A1B2C3",
        "status": "pending",
        "total_amount": "175.00",
        "created_at": "2025-08-15T10:00:00.000000Z",
        "updated_at": "2025-08-15T10:00:00.000000Z",
        "order_items": [
          {
            "id": 1,
            "order_id": 1,
            "product_id": 1,
            "quantity": 2,
            "unit_price": "75.00",
            "created_at": "2025-08-15T10:00:00.000000Z",
            "updated_at": "2025-08-15T10:00:00.000000Z",
            "product": {
              "id": 1,
              "name": "Product A",
              "description": "Description of Product A",
              "price": "75.00",
              "stock_quantity": 18,
              "created_at": "2025-08-15T09:00:00.000000Z",
              "updated_at": "2025-08-15T10:00:00.000000Z"
            }
          },
          {
            "id": 2,
            "order_id": 1,
            "product_id": 3,
            "quantity": 1,
            "unit_price": "25.00",
            "created_at": "2025-08-15T10:00:00.000000Z",
            "updated_at": "2025-08-15T10:00:00.000000Z",
            "product": {
              "id": 3,
              "name": "Product C",
              "description": "Description of Product C",
              "price": "25.00",
              "stock_quantity": 9,
              "created_at": "2025-08-15T09:00:00.000000Z",
              "updated_at": "2025-08-15T10:00:00.000000Z"
            }
          }
        ]
      }
    }
    ```

### Confirm an order

Confirms an order and deducts inventory.

- **URL**: `/api/orders/{id}/confirm`
- **Method**: `PUT`
- **URL Parameters**:
  - `id`: The ID of the order to confirm
- **Response**:
  - Status: 200 OK
  - Body:
    ```json
    {
      "status": "success",
      "message": "Order confirmed and inventory updated",
      "data": {
        "order": {
          "id": 1,
          "order_number": "ORD-20250815-A1B2C3",
          "status": "confirmed",
          "total_amount": "175.00",
          "created_at": "2025-08-15T10:00:00.000000Z",
          "updated_at": "2025-08-15T10:05:00.000000Z",
          "order_items": [
            {
              "id": 1,
              "order_id": 1,
              "product_id": 1,
              "quantity": 2,
              "unit_price": "75.00",
              "created_at": "2025-08-15T10:00:00.000000Z",
              "updated_at": "2025-08-15T10:00:00.000000Z",
              "product": {
                "id": 1,
                "name": "Product A",
                "description": "Description of Product A",
                "price": "75.00",
                "stock_quantity": 18,
                "created_at": "2025-08-15T09:00:00.000000Z",
                "updated_at": "2025-08-15T10:05:00.000000Z"
              }
            },
            {
              "id": 2,
              "order_id": 1,
              "product_id": 3,
              "quantity": 1,
              "unit_price": "25.00",
              "created_at": "2025-08-15T10:00:00.000000Z",
              "updated_at": "2025-08-15T10:00:00.000000Z",
              "product": {
                "id": 3,
                "name": "Product C",
                "description": "Description of Product C",
                "price": "25.00",
                "stock_quantity": 9,
                "created_at": "2025-08-15T09:00:00.000000Z",
                "updated_at": "2025-08-15T10:05:00.000000Z"
              }
            }
          ]
        }
      }
    }
    ```

### Cancel an order (full cancellation)

Cancels an entire order and restores inventory if the order was confirmed.

- **URL**: `/api/orders/{id}/cancel`
- **Method**: `PUT`
- **URL Parameters**:
  - `id`: The ID of the order to cancel
- **Response**:
  - Status: 200 OK
  - Body:
    ```json
    {
      "status": "success",
      "message": "Order cancelled successfully and inventory restored",
      "data": {
        "order": {
          "id": 1,
          "order_number": "ORD-20250815-A1B2C3",
          "status": "cancelled",
          "total_amount": "0.00",
          "created_at": "2025-08-15T10:00:00.000000Z",
          "updated_at": "2025-08-15T10:10:00.000000Z",
          "order_items": [
            {
              "id": 1,
              "order_id": 1,
              "product_id": 1,
              "quantity": 2,
              "cancelled_quantity": 2,
              "unit_price": "75.00",
              "created_at": "2025-08-15T10:00:00.000000Z",
              "updated_at": "2025-08-15T10:10:00.000000Z"
            }
          ]
        }
      }
    }
    ```

### Cancel specific items (partial cancellation)

Cancels specific items in an order and restores inventory if the order was confirmed.

- **URL**: `/api/orders/{id}/cancel-items`
- **Method**: `PUT`
- **URL Parameters**:
  - `id`: The ID of the order containing items to cancel
- **Request Body**:
  ```json
  {
    "items": [
      {
        "order_item_id": 1,
        "quantity": 1
      },
      {
        "order_item_id": 2,
        "quantity": 2
      }
    ]
  }
  ```
- **Response**:
  - Status: 200 OK
  - Body:
    ```json
    {
      "status": "success",
      "message": "Items partially cancelled and inventory restored",
      "data": {
        "order": {
          "id": 1,
          "order_number": "ORD-20250815-A1B2C3",
          "status": "partially_cancelled",
          "total_amount": "100.00",
          "created_at": "2025-08-15T10:00:00.000000Z",
          "updated_at": "2025-08-15T10:15:00.000000Z",
          "order_items": [
            {
              "id": 1,
              "order_id": 1,
              "product_id": 1,
              "quantity": 2,
              "cancelled_quantity": 1,
              "unit_price": "75.00",
              "created_at": "2025-08-15T10:00:00.000000Z",
              "updated_at": "2025-08-15T10:15:00.000000Z",
              "product": {
                "id": 1,
                "name": "Product A",
                "description": "Description of Product A",
                "price": "75.00",
                "stock_quantity": 19,
                "created_at": "2025-08-15T09:00:00.000000Z",
                "updated_at": "2025-08-15T10:15:00.000000Z"
              }
            },
            {
              "id": 2,
              "order_id": 1,
              "product_id": 3,
              "quantity": 2,
              "cancelled_quantity": 2,
              "unit_price": "25.00",
              "created_at": "2025-08-15T10:00:00.000000Z",
              "updated_at": "2025-08-15T10:15:00.000000Z",
              "product": {
                "id": 3,
                "name": "Product C",
                "description": "Description of Product C",
                "price": "25.00",
                "stock_quantity": 11,
                "created_at": "2025-08-15T09:00:00.000000Z",
                "updated_at": "2025-08-15T10:15:00.000000Z"
              }
            }
          ]
        }
      }
    }
    ```

## Error Responses

### Invalid Input

- Status: 422 Unprocessable Entity
- Body:
  ```json
  {
    "status": "error",
    "message": "The given data was invalid.",
    "errors": {
      "products": ["At least one product is required to create an order"],
      "products.0.product_id": ["The selected product does not exist"]
    }
  }
  ```

### Product Not in Stock

- Status: 422 Unprocessable Entity
- Body:
  ```json
  {
    "status": "error",
    "message": "The given data was invalid.",
    "errors": {
      "products": ["Not enough stock for product: Product A"]
    }
  }
  ```

### Order Not Found

- Status: 404 Not Found
- Body:
  ```json
  {
    "status": "error",
    "message": "Order not found"
  }
  ```

### Server Error

- Status: 500 Internal Server Error
- Body:
  ```json
  {
    "status": "error",
    "message": "Order creation failed",
    "error": "Error details"
  }
  ```
