# Order Management System - Setup Instructions

This guide will walk you through the process of setting up the Order Management System application on your local environment.

## Prerequisites

- PHP 8.4 or higher
- Composer
- MySQL 8.0 or higher
- Node.js 18.x or higher and npm
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/lanceliamll/order-management-system.git
cd order-management-system
```

### 2. Install PHP Dependencies

```bash
cd src
composer install
```

### 3. Install Frontend Dependencies

```bash
npm install
```

## Database Setup

### 1. Create a MySQL Database

```bash
# Access MySQL
mysql -u root -p

# Create the database
CREATE DATABASE order_management;

# Create a user and grant privileges
CREATE USER 'order_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON order_management.* TO 'order_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Configure Database Connection

Copy the example environment file:

```bash
cp .env.example .env
```

Update the database connection details in the `.env` file:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=order_management
DB_USERNAME=order_user
DB_PASSWORD=password
```

### 3. Run Migrations

Run the migrations to create the database schema:

```bash
php artisan migrate
```

> **Note:** If you encounter issues with specific migrations, you can run individual migrations:
>
> ```bash
> php artisan migrate --path=database/migrations/2025_08_16_000001_add_cancelled_quantity_to_order_items_table.php
> php artisan migrate --path=database/migrations/2025_08_16_000002_create_order_logs_table.php
> ```

## Environment Configuration

### 1. Application Key

Generate the application key:

```bash
php artisan key:generate
```

### 2. API Configuration

Configure API settings in your `.env` file:

```
API_TOKEN_EXPIRATION=60 # Token expiration time in minutes
SANCTUM_STATEFUL_DOMAINS=localhost:8000
SESSION_DOMAIN=localhost
```

### 3. Configure Cache and Queue (Optional)

For production environments, configure Redis for better performance:

```
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

## Sample Data Instructions

### 1. Run Database Seeders

Populate the database with sample data:

```bash
php artisan db:seed
```

This will create:
- Sample products with inventory
- Demo users with different roles
- Sample orders in various statuses

### 2. Create a Test API Token

Generate an API token for testing:

```bash
php artisan tinker
```

Then run:

```php
$user = \App\Models\User::find(1);
$token = $user->createToken('test-token')->plainTextToken;
echo $token;
```

Save this token for API testing.

### 3. Import Postman Collection (Optional)

A Postman collection is available at:
```
src/resources/docs/products-api-postman-collection.json
```

Import this into Postman to quickly test the API endpoints.

## Running the Application

### 1. Start the Development Server

```bash
php artisan serve
```

### 2. Build Frontend Assets

```bash
npm run dev
```

### 3. Access the Application

- Web interface: [http://localhost:8000](http://localhost:8000)
- API documentation: [http://localhost:8000/docs/api](http://localhost:8000/docs/api)

## Troubleshooting

### Common Issues

#### Missing Tables
If you encounter errors about missing tables, run the specific migrations:

```bash
php artisan migrate --path=database/migrations/specific_migration_file.php
```

#### Permission Issues
Ensure storage and bootstrap/cache directories are writable:

```bash
chmod -R 777 storage bootstrap/cache
```

#### API Authentication Errors
Verify your token format and expiration:

```
Authorization: Bearer YOUR_API_TOKEN
```

## Next Steps

- Review API documentation in the `src/resources/docs` folder
- Check out the quickstart guides for Products and Orders APIs
- Explore the Reports API for business intelligence features

For more detailed information, refer to the project documentation.
