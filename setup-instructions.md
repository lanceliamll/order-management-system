# Order Management System - Setup Instructions

This guide provides detailed instructions for setting up the Order Management System application on your local environment, with a focus on database configuration, environment setup, and sample data.

## Prerequisites

- PHP 8.4 or higher
- Composer
- MySQL 8.0 or higher (or SQLite for development)
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

### Option 1: MySQL Setup (Recommended for Production)

#### 1. Create a MySQL Database

```bash
# Access MySQL
mysql -u root -p

# Create the database
CREATE DATABASE order_management;

# Create a user and grant privileges
CREATE USER 'order_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON order_management.* TO 'order_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 2. Configure MySQL Connection

Update the database connection details in the `.env` file:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=order_management
DB_USERNAME=order_user
DB_PASSWORD=your_secure_password
```

### Option 2: SQLite Setup (Quick Development Setup)

#### 1. Create SQLite Database File

```bash
touch database/database.sqlite
```

#### 2. Configure SQLite Connection

Update the database connection details in the `.env` file:

```
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/src/database/database.sqlite
```

Replace `/absolute/path/to/` with the actual path to your project directory.

### Option 3: PostgreSQL Setup (Alternative)

#### 1. Create a PostgreSQL Database

```bash
# Access PostgreSQL
psql -U postgres

# Create the database and user
CREATE DATABASE order_management;
CREATE USER order_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE order_management TO order_user;
\q
```

#### 2. Configure PostgreSQL Connection

Update the database connection details in the `.env` file:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=order_management
DB_USERNAME=order_user
DB_PASSWORD=your_secure_password
```

### 3. Run Database Migrations

Run the migrations to create the database schema:

```bash
php artisan migrate
```

If you encounter issues with specific migrations, you can run them individually:

```bash
php artisan migrate --path=database/migrations/2025_08_16_000001_add_cancelled_quantity_to_order_items_table.php
php artisan migrate --path=database/migrations/2025_08_16_000002_create_order_logs_table.php
```

## Environment Configuration

### 1. Basic Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Generate the application key:

```bash
php artisan key:generate
```

Configure basic application settings:

```
APP_NAME="Order Management System"
APP_ENV=local  # Use 'production' for production environments
APP_DEBUG=true  # Set to 'false' in production
APP_URL=http://localhost:8000
```

### 2. API Configuration

Configure API settings in your `.env` file:

```
API_TOKEN_EXPIRATION=60  # Token expiration time in minutes
SANCTUM_STATEFUL_DOMAINS=localhost:8000
SESSION_DOMAIN=localhost
```

### 3. Email Configuration (Optional)

Configure email settings for order notifications:

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io  # For development with Mailtrap
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=orders@yourcompany.com
MAIL_FROM_NAME="${APP_NAME}"
```

### 4. Cache and Queue Configuration

For development:

```
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
```

For production (with Redis for better performance):

```
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

## Sample Data Instructions

### 1. Basic Data Seeding

Run the database seeders to populate the database with essential sample data:

```bash
php artisan db:seed
```

This will create:
- Sample products with inventory
- Demo users with different roles
- Sample orders in various statuses

### 2. Custom Seeding Options

You can control the amount of sample data by using environment variables:

```bash
# Set environment variables before running the seeder
SEED_USERS=20 SEED_PRODUCTS=100 SEED_ORDERS=50 php artisan db:seed --class=DevelopmentDataSeeder
```

### 3. Reset and Reload Sample Data

To completely reset the database and reload all sample data:

```bash
php artisan migrate:fresh --seed
```

**Warning**: This will delete all existing data in the database.

### 4. Available Test Accounts

After seeding, you can log in with the following accounts:

| Role  | Email               | Password |
|-------|---------------------|----------|
| Admin | admin@example.com   | password |
| Staff | staff@example.com   | password |
| User  | customer@example.com| password |

### 5. Create API Tokens for Testing

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

### 6. Import Postman Collection

A Postman collection is available at:
```
src/resources/docs/products-api-postman-collection.json
```

Import this into Postman to quickly test the API endpoints.

## Verifying Setup

After completing the setup and loading sample data, verify that everything is working correctly:

### 1. Check Database Connection

```bash
php artisan tinker
>>> DB::connection()->getPdo();
```

If successful, this should return a PDO instance without errors.

### 2. Run Tests (Optional)

```bash
php artisan test
```

### 3. Start the Development Server

```bash
php artisan serve
```

### 4. Build Frontend Assets

```bash
npm run dev
```

### 5. Access the Application

- Web interface: [http://localhost:8000](http://localhost:8000)
- API documentation: [http://localhost:8000/docs/api](http://localhost:8000/docs/api)

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify database credentials in `.env`
2. Ensure the database server is running
3. Check that the database and user exist with proper permissions
4. For SQLite, ensure the database file exists and is writable

```bash
# Check database connection
php artisan db:monitor
```

### Migration Errors

If migrations fail:

```bash
# Show migration status
php artisan migrate:status

# Try running migrations with debug information
php artisan migrate --pretend
```

### Permission Issues

Ensure storage and bootstrap/cache directories are writable:

```bash
chmod -R 777 storage bootstrap/cache
```

### API Authentication Errors

Verify your token format and expiration:

```
Authorization: Bearer YOUR_API_TOKEN
```

## Next Steps

- Review API documentation in the `src/resources/docs` folder
- Check out the quickstart guides for Products and Orders APIs
- Explore the Reports API for business intelligence features

For more detailed information, refer to the project documentation.
