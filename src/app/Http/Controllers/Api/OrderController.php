<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOrderRequest;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderLog;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Display a listing of the orders.
     */
    public function index(): JsonResponse
    {
        $orders = Order::with('orderItems')->latest()->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $orders
        ]);
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        try {
            // Use a transaction to ensure data integrity
            return DB::transaction(function () use ($request) {
                // Create a new order
                $order = Order::create([
                    'order_number' => Order::generateOrderNumber(),
                    'status' => 'pending',
                    'total_amount' => 0, // Will be calculated after adding items
                ]);
                
                $totalAmount = 0;
                
                // Add order items
                foreach ($request->products as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    
                    // Check if enough stock is available
                    if ($product->stock_quantity < $item['quantity']) {
                        throw ValidationException::withMessages([
                            'products' => ["Not enough stock for product: {$product->name}"]
                        ]);
                    }
                    
                    // Create order item
                    $orderItem = new OrderItem([
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $product->price,
                    ]);
                    
                    $order->orderItems()->save($orderItem);
                    
                    // Update total
                    $totalAmount += $orderItem->quantity * $orderItem->unit_price;
                }
                
                // Update order total
                $order->update(['total_amount' => $totalAmount]);
                
                // Log order creation
                OrderLog::log(
                    $order->id,
                    OrderLog::ACTIVITY_CREATED,
                    [
                        'total_amount' => $totalAmount,
                        'items_count' => count($request->products)
                    ]
                );
                
                return response()->json([
                    'status' => 'success',
                    'message' => 'Order created successfully',
                    'data' => [
                        'order' => $order->fresh('orderItems')
                    ]
                ], 201);
            });
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order creation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified order.
     */
    public function show(string $id): JsonResponse
    {
        $order = Order::with('orderItems.product')->findOrFail($id);
        
        return response()->json([
            'status' => 'success',
            'data' => $order
        ]);
    }

    /**
     * Confirm an order and deduct inventory.
     */
    public function confirm(string $id): JsonResponse
    {
        try {
            return DB::transaction(function () use ($id) {
                $order = Order::with('orderItems.product')->findOrFail($id);
                
                // Check if order is already confirmed
                if ($order->status === 'confirmed') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Order has already been confirmed'
                    ], 422);
                }
                
                // Check if order is cancelled
                if ($order->status === 'cancelled') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Cannot confirm a cancelled order'
                    ], 422);
                }
                
                // Deduct inventory for each product
                foreach ($order->orderItems as $item) {
                    $product = $item->product;
                    
                    // Check if enough stock is available
                    if ($product->stock_quantity < $item->quantity) {
                        throw ValidationException::withMessages([
                            'inventory' => ["Not enough stock for product: {$product->name}"]
                        ]);
                    }
                    
                    // Update and log product stock reduction
                    $product->updateStock(-$item->quantity, InventoryLog::REASON_ORDER_CONFIRMED);
                }
                
                // Update order status
                $order->status = 'confirmed';
                $order->save();
                
                // Log order confirmation
                OrderLog::log(
                    $order->id,
                    OrderLog::ACTIVITY_CONFIRMED,
                    [
                        'total_amount' => $order->total_amount
                    ]
                );
                
                return response()->json([
                    'status' => 'success',
                    'message' => 'Order confirmed and inventory updated',
                    'data' => [
                        'order' => $order->fresh('orderItems.product')
                    ]
                ]);
            });
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order confirmation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel an entire order.
     */
    public function cancel(string $id): JsonResponse
    {
        try {
            return DB::transaction(function () use ($id) {
                $order = Order::with('orderItems.product')->findOrFail($id);
                
                // Check if order is already fully cancelled
                if ($order->status === 'cancelled') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Order has already been cancelled'
                    ], 422);
                }
                
                // Check if the order has confirmed status but no inventory deducted yet
                if ($order->status === 'confirmed') {
                    // For confirmed orders, we need to restore inventory
                    foreach ($order->orderItems as $item) {
                        // Only restore inventory for non-cancelled quantities
                        $quantityToRestore = $item->quantity - $item->cancelled_quantity;
                        
                        if ($quantityToRestore > 0) {
                            // Restore inventory and log it
                            $product = $item->product;
                            $product->updateStock($quantityToRestore, InventoryLog::REASON_ORDER_CANCELLED);
                            
                            // Mark item as fully cancelled
                            $item->cancelled_quantity = $item->quantity;
                            $item->save();
                        }
                    }
                } else {
                    // For pending orders, just mark all items as cancelled
                    foreach ($order->orderItems as $item) {
                        $item->cancelled_quantity = $item->quantity;
                        $item->save();
                    }
                }
                
                // Update order status and total
                $order->status = 'cancelled';
                $order->total_amount = 0; // Zero out the total since everything is cancelled
                $order->save();
                
                // Log order cancellation
                OrderLog::log(
                    $order->id,
                    OrderLog::ACTIVITY_CANCELLED,
                    [
                        'previous_total' => $order->getOriginal('total_amount'),
                        'new_total' => 0
                    ]
                );
                
                return response()->json([
                    'status' => 'success',
                    'message' => 'Order cancelled successfully and inventory restored',
                    'data' => [
                        'order' => $order->fresh('orderItems.product')
                    ]
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order cancellation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Cancel specific items in an order (partial cancellation).
     */
    /**
     * Get activity logs for an order.
     */
    public function activity(string $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $logs = $order->logs()->with('order')->latest()->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }
    
    /**
     * Cancel specific items in an order (partial cancellation).
     */
    public function cancelItems(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.order_item_id' => 'required|exists:order_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);
        
        try {
            return DB::transaction(function () use ($request, $id) {
                $order = Order::with('orderItems.product')->findOrFail($id);
                
                // Check if order is already cancelled
                if ($order->status === 'cancelled') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Order has already been fully cancelled'
                    ], 422);
                }
                
                $allItemsCancelled = true;
                $someItemsCancelled = false;
                
                // Process each item for cancellation
                foreach ($request->items as $cancelItem) {
                    $orderItem = $order->orderItems->firstWhere('id', $cancelItem['order_item_id']);
                    
                    if (!$orderItem) {
                        continue; // Skip if item not found
                    }
                    
                    // Calculate how many more can be cancelled
                    $maxCancellable = $orderItem->quantity - $orderItem->cancelled_quantity;
                    $quantityToCancel = min($cancelItem['quantity'], $maxCancellable);
                    
                    if ($quantityToCancel <= 0) {
                        continue; // Nothing to cancel
                    }
                    
                    // Update cancelled quantity
                    $orderItem->cancelled_quantity += $quantityToCancel;
                    $orderItem->save();
                    
                    $someItemsCancelled = true;
                    
                    // If this is a confirmed order, restore inventory
                    if ($order->status === 'confirmed') {
                        $product = $orderItem->product;
                        $product->updateStock($quantityToCancel, InventoryLog::REASON_ORDER_CANCELLED);
                    }
                    
                    // Check if any items are not fully cancelled
                    if ($orderItem->cancelled_quantity < $orderItem->quantity) {
                        $allItemsCancelled = false;
                    }
                }
                
                // Don't update anything if no items were actually cancelled
                if (!$someItemsCancelled) {
                    return response()->json([
                        'status' => 'info',
                        'message' => 'No items were cancelled',
                        'data' => [
                            'order' => $order
                        ]
                    ]);
                }
                
                // Recalculate total
                $newTotal = $order->calculateActiveTotal();
                $order->total_amount = $newTotal;
                
                // Update order status based on cancellation status
                if ($allItemsCancelled) {
                    $order->status = 'cancelled';
                } else {
                    $order->status = 'partially_cancelled';
                    
                    // If order was pending, keep it pending with partial cancellations
                    if ($order->status === 'pending') {
                        $order->status = 'pending'; // Status remains pending
                    }
                }
                
                $order->save();
                
                // Log order cancellation (full or partial)
                OrderLog::log(
                    $order->id,
                    $allItemsCancelled ? OrderLog::ACTIVITY_CANCELLED : OrderLog::ACTIVITY_PARTIALLY_CANCELLED,
                    [
                        'items_cancelled' => $request->items,
                        'new_total' => $newTotal
                    ]
                );
                
                return response()->json([
                    'status' => 'success',
                    'message' => $allItemsCancelled ? 
                        'All items cancelled and order marked as cancelled' : 
                        'Items partially cancelled and inventory restored',
                    'data' => [
                        'order' => $order->fresh('orderItems.product')
                    ]
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Item cancellation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get activity logs for a specific order.
     * 
     * This endpoint retrieves a chronological history of all actions performed on an order,
     * including order creation, confirmation, cancellation, and item changes.
     * Each log entry includes details about the action, timestamp, and associated metadata.
     * 
     * This is useful for:
     * - Troubleshooting order issues
     * - Auditing order changes
     * - Providing detailed order history to customers or support staff
     *
     * @param  int  $id  The order ID to retrieve activity logs for
     * @return \Illuminate\Http\JsonResponse
     */
    public function activity($id): JsonResponse
    {
        $order = Order::find($id);
        
        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order not found'
            ], 404);
        }
        
        $logs = OrderLog::where('order_id', $id)
            ->latest('created_at')
            ->get();
            
        return response()->json([
            'status' => 'success',
            'data' => [
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'total_amount' => $order->total_amount
                ],
                'logs' => $logs
            ]
        ]);
    }
}
