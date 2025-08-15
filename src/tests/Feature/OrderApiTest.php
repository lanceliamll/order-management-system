<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_an_order()
    {
        // Create products
        $product1 = Product::factory()->create([
            'price' => 50.00,
            'stock_quantity' => 10,
        ]);
        
        $product2 = Product::factory()->create([
            'price' => 25.00,
            'stock_quantity' => 20,
        ]);
        
        // Create request data
        $orderData = [
            'products' => [
                [
                    'product_id' => $product1->id,
                    'quantity' => 2,
                ],
                [
                    'product_id' => $product2->id,
                    'quantity' => 3,
                ],
            ],
        ];
        
        // Make the request
        $response = $this->postJson('/api/orders', $orderData);
        
        // Assert response
        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Order created successfully')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'order' => [
                        'id',
                        'order_number',
                        'status',
                        'total_amount',
                        'created_at',
                        'updated_at',
                        'order_items' => [
                            '*' => [
                                'id',
                                'order_id',
                                'product_id',
                                'quantity',
                                'unit_price',
                            ],
                        ],
                    ],
                ],
            ]);
        
        // Calculate expected total
        $expectedTotal = ($product1->price * 2) + ($product2->price * 3);
        
        // Assert database
        $this->assertDatabaseHas('orders', [
            'id' => $response->json('data.order.id'),
            'status' => 'pending',
            'total_amount' => $expectedTotal,
        ]);
        
        // Assert order items
        $this->assertDatabaseHas('order_items', [
            'order_id' => $response->json('data.order.id'),
            'product_id' => $product1->id,
            'quantity' => 2,
            'unit_price' => $product1->price,
        ]);
        
        $this->assertDatabaseHas('order_items', [
            'order_id' => $response->json('data.order.id'),
            'product_id' => $product2->id,
            'quantity' => 3,
            'unit_price' => $product2->price,
        ]);
    }

    /** @test */
    public function it_confirms_an_order_and_deducts_inventory()
    {
        // Create products
        $product = Product::factory()->create([
            'price' => 50.00,
            'stock_quantity' => 10,
        ]);
        
        // Create request data
        $orderData = [
            'products' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                ],
            ],
        ];
        
        // Create an order
        $createResponse = $this->postJson('/api/orders', $orderData);
        $orderId = $createResponse->json('data.order.id');
        
        // Confirm the order
        $confirmResponse = $this->putJson("/api/orders/{$orderId}/confirm");
        
        // Assert response
        $confirmResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Order confirmed and inventory updated');
        
        // Assert database - order status
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => 'confirmed',
        ]);
        
        // Assert database - product inventory
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 8, // Initial 10 minus 2
        ]);
    }
}
