<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

return new class extends Migration
{
    public function up(): void
    {
        // Load the schema.sql file
        $path = base_path('../database/schema.sql');
        $sql = File::get($path);

        // Execute the SQL
        DB::unprepared($sql);
    }

    public function down(): void
    {
        // Drop tables in reverse order to avoid FK constraint issues
        DB::unprepared("
            DROP TABLE IF EXISTS inventory_logs;
            DROP TABLE IF EXISTS order_items;
            DROP TABLE IF EXISTS orders;
            DROP TABLE IF EXISTS products;
        ");
    }
};