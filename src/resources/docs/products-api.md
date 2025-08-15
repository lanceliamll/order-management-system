# Order Management System: Products API Documentation

This documentation provides details on how to use the Products API for managing products and inventory in the Order Management System.

## Base URL

- **Direct Access**: `http://your-domain.com/products`
- **API Prefix**: `http://your-domain.com/api/products`

## Authentication

API endpoints are currently public and do not require authentication. In a production environment, you may want to add authentication to secure these endpoints.

## Response Format

All API responses follow a standard format:

```json
{
  "success": true|false,
  "message": "Optional message about the result",
  "data": { ... } // The actual response data
}
```

Error responses include:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Product Endpoints

### 1. List All Products

Retrieves a list of all products.

- **URL**: `/products`
- **Method**: `GET`
- **URL Parameters**: None
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "name": "Product Name",
          "description": "Product Description",
          "price": "19.99",
          "stock_quantity": 100,
          "created_at": "2025-08-15T12:00:00.000000Z",
          "updated_at": "2025-08-15T12:00:00.000000Z"
        },
        // ... more products
      ]
    }
    ```

### 2. Create a Product

Creates a new product.

- **URL**: `/products`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "New Product",
    "description": "Product description",
    "price": 29.99,
    "stock_quantity": 50
  }
  ```
- **Required Fields**:
  - `name` (string): The product name
  - `price` (number): The product price
  - `stock_quantity` (integer): Initial stock quantity
- **Optional Fields**:
  - `description` (string): Product description
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Product created successfully",
      "data": {
        "id": 1,
        "name": "New Product",
        "description": "Product description",
        "price": "29.99",
        "stock_quantity": 50,
        "created_at": "2025-08-15T12:00:00.000000Z",
        "updated_at": "2025-08-15T12:00:00.000000Z"
      }
    }
    ```
- **Error Response**:
  - **Code**: 422 Unprocessable Entity
  - **Content**:
    ```json
    {
      "success": false,
      "errors": {
        "name": ["The name field is required."],
        "price": ["The price must be at least 0."]
        // ... other validation errors
      }
    }
    ```

### 3. Get a Single Product

Retrieves details for a specific product.

- **URL**: `/products/{id}`
- **Method**: `GET`
- **URL Parameters**:
  - `id` (required): Product ID
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "id": 1,
        "name": "Product Name",
        "description": "Product Description",
        "price": "19.99",
        "stock_quantity": 100,
        "created_at": "2025-08-15T12:00:00.000000Z",
        "updated_at": "2025-08-15T12:00:00.000000Z"
      }
    }
    ```
- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**:
    ```json
    {
      "success": false,
      "message": "Product not found"
    }
    ```

### 4. Update a Product

Updates an existing product.

- **URL**: `/products/{id}`
- **Method**: `PUT`
- **Headers**:
  - `Content-Type: application/json`
- **URL Parameters**:
  - `id` (required): Product ID
- **Request Body**: (include only the fields you want to update)
  ```json
  {
    "name": "Updated Product Name",
    "price": 39.99,
    "stock_quantity": 75
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Product updated successfully",
      "data": {
        "id": 1,
        "name": "Updated Product Name",
        "description": "Product Description",
        "price": "39.99",
        "stock_quantity": 75,
        "created_at": "2025-08-15T12:00:00.000000Z",
        "updated_at": "2025-08-15T12:30:00.000000Z"
      }
    }
    ```
- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**:
    ```json
    {
      "success": false,
      "message": "Product not found"
    }
    ```

### 5. Delete a Product

Deletes a specific product.

- **URL**: `/products/{id}`
- **Method**: `DELETE`
- **URL Parameters**:
  - `id` (required): Product ID
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Product deleted successfully"
    }
    ```
- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**:
    ```json
    {
      "success": false,
      "message": "Product not found"
    }
    ```

## Inventory Management Endpoints

### 1. Get Current Inventory

Retrieves the current inventory status for all products.

- **URL**: `/products/inventory/all`
- **Method**: `GET`
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "name": "Product Name",
          "stock_quantity": 100
        },
        // ... more products
      ]
    }
    ```

### 2. Update Product Stock

Updates the stock quantity for a specific product.

- **URL**: `/products/{id}/stock`
- **Method**: `PUT`
- **Headers**:
  - `Content-Type: application/json`
- **URL Parameters**:
  - `id` (required): Product ID
- **Request Body**:
  ```json
  {
    "stock_quantity": 150
  }
  ```
- **Required Fields**:
  - `stock_quantity` (integer): The new stock quantity value
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Stock updated successfully",
      "data": {
        "id": 1,
        "name": "Product Name",
        "stock_quantity": 150
      }
    }
    ```
- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**:
    ```json
    {
      "success": false,
      "message": "Product not found"
    }
    ```

### 3. Get Low Stock Products

Retrieves a list of products with stock below a certain threshold.

- **URL**: `/products/inventory/low-stock`
- **Method**: `GET`
- **Query Parameters**:
  - `threshold` (optional): The stock threshold (default: 10)
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 3,
          "name": "Low Stock Product",
          "stock_quantity": 5
        },
        // ... more low stock products
      ]
    }
    ```

## Code Examples

### Example 1: Fetch All Products

```javascript
// Using fetch API
fetch('http://your-domain.com/products')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Products:', data.data);
    }
  })
  .catch(error => console.error('Error fetching products:', error));
```

### Example 2: Create a Product

```javascript
// Using fetch API
const newProduct = {
  name: 'New Product',
  description: 'This is a test product',
  price: 19.99,
  stock_quantity: 100
};

fetch('http://your-domain.com/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newProduct)
})
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Product created:', data.data);
    } else {
      console.error('Error creating product:', data.errors);
    }
  })
  .catch(error => console.error('Error:', error));
```

### Example 3: Check Low Stock Products

```javascript
// Using fetch API
fetch('http://your-domain.com/products/inventory/low-stock?threshold=20')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Low stock products:', data.data);
    }
  })
  .catch(error => console.error('Error fetching low stock products:', error));
```

## Best Practices

1. **Error Handling**: Always check the `success` field in the response to determine if the API call was successful.

2. **Input Validation**: Validate input on the client side before sending it to the API to reduce unnecessary server requests.

3. **Pagination**: For production applications with many products, consider implementing pagination for list endpoints.

## Troubleshooting

- **404 Not Found**: Ensure you're using the correct endpoint URL and the product ID exists.
- **422 Validation Error**: Check the error messages in the response for specific validation failures.
- **500 Server Error**: Contact the API administrator for server-side issues.

## Support

For additional support or questions about the Products API, please contact the development team.

---

*Documentation last updated: August 15, 2025*
