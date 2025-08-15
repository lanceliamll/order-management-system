# Products API: Quick Start Guide

## Overview

This guide provides a quick reference for using the Products API in the Order Management System.

## Authentication

Currently, the API endpoints are public. No authentication is required.

## Base URLs

- Standard web route: `http://your-domain.com/products`
- API route with prefix: `http://your-domain.com/api/products`

## Common Headers

For POST and PUT requests:
```
Content-Type: application/json
```

## Available Endpoints

### Products Management

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/products` | GET | List all products | None |
| `/products` | POST | Create a new product | JSON body with product details |
| `/products/{id}` | GET | Get a single product | `id`: Product ID |
| `/products/{id}` | PUT | Update a product | `id`: Product ID, JSON body with fields to update |
| `/products/{id}` | DELETE | Delete a product | `id`: Product ID |

### Inventory Management

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/products/inventory/all` | GET | Get current inventory status | None |
| `/products/{id}/stock` | PUT | Update product stock | `id`: Product ID, JSON body with `stock_quantity` |
| `/products/inventory/low-stock` | GET | Get products with low stock | Query param: `threshold` (default: 10) |

## Example: Creating a Product

**Request:**

```http
POST /products HTTP/1.1
Host: your-domain.com
Content-Type: application/json

{
  "name": "Sample Product",
  "description": "This is a sample product",
  "price": 29.99,
  "stock_quantity": 100
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Sample Product",
    "description": "This is a sample product",
    "price": "29.99",
    "stock_quantity": 100,
    "created_at": "2025-08-15T12:00:00.000000Z",
    "updated_at": "2025-08-15T12:00:00.000000Z"
  }
}
```

## Example: Getting Low Stock Products

**Request:**

```http
GET /products/inventory/low-stock?threshold=20 HTTP/1.1
Host: your-domain.com
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Low Stock Product",
      "stock_quantity": 5
    },
    {
      "id": 5,
      "name": "Another Low Stock Product",
      "stock_quantity": 15
    }
  ]
}
```

## For Full Documentation

See the complete documentation in `resources/docs/products-api.md` for more details, including error responses and advanced usage.
