<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create a test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
        
        // Create some products
        Product::factory(10)->create();
        
        // Create some orders with order items
        Order::factory(5)->create()->each(function ($order) {
            // Create 1-3 order items for each order
            $numItems = rand(1, 3);
            
            // Get random products
            $products = Product::inRandomOrder()->take($numItems)->get();
            
            foreach ($products as $product) {
                OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'unit_price' => $product->price,
                ]);
            }
            
            // Update the order total
            $total = $order->orderItems->sum(function ($item) {
                return $item->quantity * $item->unit_price;
            });
            
            $order->update(['total_amount' => $total]);
        });
    }
}
