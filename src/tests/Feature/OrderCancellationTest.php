<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCancellationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_fully_cancel_an_order_and_restore_inventory()
    {
        // Create products
        $product = Product::factory()->create([
            'price' => 50.00,
            'stock_quantity' => 10,
        ]);
        
        // Create an order
        $order = Order::factory()->create([
            'status' => 'confirmed',
            'total_amount' => 100.00,
        ]);
        
        // Add items to the order
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 50.00,
        ]);
        
        // Deduct inventory to simulate a confirmed order
        $product->stock_quantity -= 2;
        $product->save();
        
        // Original stock quantity
        $originalStock = $product->stock_quantity; // Should be 8
        
        // Cancel the order
        $response = $this->putJson("/api/orders/{$order->id}/cancel");
        
        // Assert response
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Order cancelled successfully and inventory restored');
        
        // Refresh the product
        $product->refresh();
        
        // Assert inventory restored
        $this->assertEquals($originalStock + 2, $product->stock_quantity); // Should be 10 again
        
        // Assert order status
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'cancelled',
        ]);
        
        // Assert order item cancelled_quantity
        $this->assertDatabaseHas('order_items', [
            'id' => $orderItem->id,
            'cancelled_quantity' => 2,
        ]);
    }
    
    /** @test */
    public function it_can_partially_cancel_items_in_an_order()
    {
        // Create products
        $product1 = Product::factory()->create([
            'price' => 50.00,
            'stock_quantity' => 8,
        ]);
        
        $product2 = Product::factory()->create([
            'price' => 25.00,
            'stock_quantity' => 5,
        ]);
        
        // Create an order
        $order = Order::factory()->create([
            'status' => 'confirmed',
            'total_amount' => 150.00,
        ]);
        
        // Add items to the order
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product1->id,
            'quantity' => 2,
            'unit_price' => 50.00,
        ]);
        
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product2->id,
            'quantity' => 2,
            'unit_price' => 25.00,
        ]);
        
        // Cancel specific items
        $response = $this->putJson("/api/orders/{$order->id}/cancel-items", [
            'items' => [
                [
                    'order_item_id' => $orderItem1->id,
                    'quantity' => 1,
                ],
            ],
        ]);
        
        // Assert response
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Items partially cancelled and inventory restored');
        
        // Refresh the products
        $product1->refresh();
        
        // Assert inventory restored for product 1 only
        $this->assertEquals(9, $product1->stock_quantity); // 8 + 1
        $this->assertEquals(5, $product2->stock_quantity); // Unchanged
        
        // Assert order status
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'partially_cancelled',
        ]);
        
        // Assert order items cancelled_quantity
        $this->assertDatabaseHas('order_items', [
            'id' => $orderItem1->id,
            'cancelled_quantity' => 1,
        ]);
        
        $this->assertDatabaseHas('order_items', [
            'id' => $orderItem2->id,
            'cancelled_quantity' => 0,
        ]);
    }
}
