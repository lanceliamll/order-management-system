<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_generate_a_unique_order_number()
    {
        $orderNumber = Order::generateOrderNumber();
        
        $this->assertStringStartsWith('ORD-', $orderNumber);
        $this->assertMatchesRegularExpression('/^ORD-\d{8}-[A-Z0-9]{6}$/', $orderNumber);
    }

    /** @test */
    public function it_can_have_order_items()
    {
        // Create an order
        $order = Order::factory()->create();
        
        // Create order items for the order
        OrderItem::factory()->count(3)->create([
            'order_id' => $order->id
        ]);
        
        $this->assertCount(3, $order->orderItems);
        $this->assertInstanceOf(OrderItem::class, $order->orderItems->first());
    }

    /** @test */
    public function it_calculates_total_amount_correctly()
    {
        // Create a product
        $product = Product::factory()->create([
            'price' => 100.00
        ]);
        
        // Create an order
        $order = Order::factory()->create([
            'total_amount' => 0
        ]);
        
        // Create order items
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => $product->price
        ]);
        
        // Calculate total
        $total = $order->orderItems->sum(function ($item) {
            return $item->quantity * $item->unit_price;
        });
        
        $order->update(['total_amount' => $total]);
        
        $this->assertEquals(200.00, $order->total_amount);
    }
}
