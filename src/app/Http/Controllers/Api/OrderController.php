<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelOrderItemsRequest;
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

/**
 * OrderController
 * 
 * Handles all API endpoints related to order management including:
 * - Order listing and retrieval
 * - Order creation
 * - Order confirmation (with inventory deduction)
 * - Order cancellation (full and partial with inventory restoration)
 * - Order activity logging
 * 
 * All operations that modify data are wrapped in database transactions
 * to ensure data integrity, especially for inventory-related operations.
 */
class OrderController extends Controller
{
    /**
     * Display a listing of the orders.
     * 
     * Retrieves a list of all orders with their items, sorted by most recent first.
     * 
     * @return \Illuminate\Http\JsonResponse
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
     * 
     * Creates a new order with the provided products. The method:
     * - Validates product availability and quantities
     * - Creates the order with a unique order number
     * - Creates order items with current product prices
     * - Calculates the total order amount
     * - Logs the order creation activity
     * 
     * This method uses database transactions to ensure data integrity.
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        try {
            // Use a transaction to ensure data integrity
            return DB::transaction(function () use ($request) {
                // Validate all products exist and have enough stock before creating anything
                foreach ($request->products as $item) {
                    $product = Product::find($item['product_id']);
                    
                    if (!$product) {
                        throw ValidationException::withMessages([
                            'products' => ["Product with ID {$item['product_id']} not found"]
                        ]);
                    }
                    
                    if ($item['quantity'] <= 0) {
                        throw ValidationException::withMessages([
                            'products' => ["Quantity must be greater than zero for product: {$product->name}"]
                        ]);
                    }
                    
                    if ($product->stock_quantity < $item['quantity']) {
                        throw ValidationException::withMessages([
                            'products' => ["Not enough stock for product: {$product->name}. Available: {$product->stock_quantity}"]
                        ]);
                    }
                }
                
                // Create a new order
                $order = Order::create([
                    'order_number' => Order::generateOrderNumber(),
                    'status' => 'pending',
                    'total_amount' => 0, // Will be calculated after adding items
                ]);
                
                $totalAmount = 0;
                
                // Add order items
                foreach ($request->products as $item) {
                    $product = Product::lockForUpdate()->findOrFail($item['product_id']);
                    
                    // Double-check stock after lock
                    if ($product->stock_quantity < $item['quantity']) {
                        throw ValidationException::withMessages([
                            'products' => ["Stock changed during checkout for: {$product->name}"]
                        ]);
                    }
                    
                    // Create order item
                    $orderItem = new OrderItem([
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $product->price,
                        'cancelled_quantity' => 0,
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
     * 
     * Retrieves a single order by ID with all its items and related product details.
     * 
     * @param  string  $id  The order ID to retrieve
     * @return \Illuminate\Http\JsonResponse
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException  When order not found
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
     * 
     * Changes order status from 'pending' to 'confirmed' and deducts product inventory.
     * This method:
     * - Verifies the order can be confirmed (not already confirmed or cancelled)
     * - Checks sufficient inventory for all items
     * - Deducts inventory with proper locking to prevent race conditions
     * - Logs inventory changes and order confirmation
     * 
     * Uses database transactions to ensure data integrity during confirmation.
     * 
     * @param  string  $id  The order ID to confirm
     * @return \Illuminate\Http\JsonResponse
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
                    
                    // Lock the product row for update to prevent concurrent inventory issues
                    $freshProduct = Product::where('id', $product->id)
                        ->lockForUpdate()
                        ->first();
                    
                    // Double check stock after lock to ensure it hasn't changed
                    if ($freshProduct->stock_quantity < $item->quantity) {
                        throw ValidationException::withMessages([
                            'inventory' => ["Stock level changed during checkout for: {$product->name}"]
                        ]);
                    }
                    
                    // Update and log product stock reduction
                    $freshProduct->updateStock(-$item->quantity, InventoryLog::REASON_ORDER_CONFIRMED);
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
     * 
     * Cancels an entire order and restores inventory if needed.
     * This method handles both pending and confirmed orders differently:
     * - For pending orders: Simply marks all items as cancelled
     * - For confirmed orders: Restores inventory and marks items as cancelled
     * 
     * Uses database transactions to ensure data integrity during the cancellation process.
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
                            // Lock the product row for update to prevent concurrent inventory issues
                            $product = Product::where('id', $item->product_id)
                                ->lockForUpdate()
                                ->first();
                                
                            if (!$product) {
                                throw new \Exception("Product with ID {$item->product_id} not found during cancellation");
                            }
                            
                            // Restore inventory and log it
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
     * 
     * Handles partial cancellation of specific items in an order. This method:
     * - Validates the requested items and quantities
     * - Updates the cancelled_quantity for each item
     * - Restores inventory for confirmed orders
     * - Updates the order status based on cancellation (partially_cancelled or cancelled)
     * - Recalculates the order total based on active (non-cancelled) items
     * - Logs the cancellation activity
     * 
     * Uses database transactions to ensure data integrity during the cancellation process.
     * 
     * @param  \App\Http\Requests\CancelOrderItemsRequest  $request  The validated cancellation request
     * @param  string  $id  The order ID to cancel items for
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancelItems(CancelOrderItemsRequest $request, string $id): JsonResponse
    {
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
                
                // Validate all items before making any changes
                foreach ($request->items as $cancelItem) {
                    $orderItem = $order->orderItems->firstWhere('id', $cancelItem['order_item_id']);
                    
                    if (!$orderItem) {
                        throw ValidationException::withMessages([
                            'items' => ["Order item with ID {$cancelItem['order_item_id']} not found in this order"]
                        ]);
                    }
                    
                    // Check if the quantity to cancel is valid
                    $maxCancellable = $orderItem->quantity - $orderItem->cancelled_quantity;
                    if ($cancelItem['quantity'] > $maxCancellable) {
                        throw ValidationException::withMessages([
                            'items' => ["Cannot cancel {$cancelItem['quantity']} units for item {$orderItem->id}. Maximum cancellable: {$maxCancellable}"]
                        ]);
                    }
                }
                
                $allItemsCancelled = true;
                $someItemsCancelled = false;
                $cancelledItems = [];
                
                // Process each item for cancellation
                foreach ($request->items as $cancelItem) {
                    $orderItem = $order->orderItems->firstWhere('id', $cancelItem['order_item_id']);
                    
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
                    $cancelledItems[] = [
                        'item_id' => $orderItem->id,
                        'product_id' => $orderItem->product_id,
                        'product_name' => $orderItem->product->name,
                        'quantity_cancelled' => $quantityToCancel,
                        'remaining_active' => $orderItem->quantity - $orderItem->cancelled_quantity
                    ];
                    
                    // If this is a confirmed order, restore inventory
                    if ($order->status === 'confirmed') {
                        // Lock the product row for update to prevent concurrent inventory issues
                        $product = Product::where('id', $orderItem->product_id)
                            ->lockForUpdate()
                            ->first();
                            
                        if (!$product) {
                            throw new \Exception("Product with ID {$orderItem->product_id} not found during cancellation");
                        }
                        
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
                            'items_cancelled' => $cancelledItems,
                            'previous_total' => $order->getOriginal('total_amount'),
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
            } catch (ValidationException $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation error during cancellation',
                    'errors' => $e->errors()
                ], 422);
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
            ->get();        return response()->json([
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
