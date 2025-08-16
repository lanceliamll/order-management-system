<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Requests\UpdateStockRequest;
use App\Models\InventoryLog;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * ProductController
 * 
 * Handles all API endpoints related to product management including:
 * - Product CRUD operations
 * - Inventory management
 * - Stock updates and logging
 * - Low stock monitoring
 * 
 * Operations that modify inventory are wrapped in database transactions
 * to ensure data integrity and proper logging.
 */
class ProductController extends Controller
{
    /**
     * Display a listing of all products.
     *
     * Retrieves a list of all products with their details.
     * Can be filtered or paginated using query parameters.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Apply filters and pagination if provided
        $query = Product::query();
        
        // Filter by category if specified
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        
        // Filter by minimum stock level
        if ($request->has('min_stock')) {
            $query->where('stock_quantity', '>=', $request->min_stock);
        }
        
        // Sort results
        $sortBy = $request->input('sort_by', 'id');
        $sortDir = $request->input('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);
        
        // Paginate if requested, otherwise get all
        if ($request->has('per_page')) {
            $products = $query->paginate($request->input('per_page', 15));
        } else {
            $products = $query->get();
        }
        
        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Store a newly created product in storage.
     *
     * Creates a new product with the provided information.
     * Validates input data and returns the created product.
     * Uses transaction to ensure data integrity.
     *
     * @param  \App\Http\Requests\CreateProductRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(CreateProductRequest $request): JsonResponse
    {
        try {
            // Use a transaction to ensure data integrity
            return DB::transaction(function () use ($request) {
                // Create the product with validated data
                $product = Product::create($request->validated());
                
                // Log the initial inventory
                if ($product->stock_quantity > 0) {
                    InventoryLog::create([
                        'product_id' => $product->id,
                        'change_type' => InventoryLog::CHANGE_INCREASE,
                        'quantity_change' => $product->stock_quantity,
                        'reason' => 'Initial inventory',
                    ]);
                }
                
                return response()->json([
                    'success' => true,
                    'message' => 'Product created successfully',
                    'data' => $product,
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified product.
     *
     * Retrieves detailed information about a specific product by ID.
     * Includes inventory status and other related details.
     *
     * @param  int  $id  The product ID to retrieve
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id): JsonResponse
    {
        $product = Product::with('inventoryLogs')->find($id);
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        // Get recent inventory activities for this product
        $recentActivities = InventoryLog::where('product_id', $id)
            ->latest('created_at')
            ->take(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'recent_activities' => $recentActivities
            ],
        ]);
    }

    /**
     * Update the specified product in storage.
     *
     * Updates an existing product with the provided information.
     * Validates input data and returns the updated product.
     * Uses transaction to ensure data integrity.
     *
     * @param  \App\Http\Requests\UpdateProductRequest  $request
     * @param  int  $id  The product ID to update
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(UpdateProductRequest $request, $id): JsonResponse
    {
        try {
            return DB::transaction(function () use ($request, $id) {
                $product = Product::findOrFail($id);
                
                // Store the old stock quantity for comparison
                $oldStockQuantity = $product->stock_quantity;
                
                // Update the product with validated data
                $product->update($request->validated());
                
                // Log any stock quantity changes
                if (isset($request->validated()['stock_quantity']) && $oldStockQuantity != $product->stock_quantity) {
                    $quantityChange = $product->stock_quantity - $oldStockQuantity;
                    $changeType = $quantityChange > 0 ? InventoryLog::CHANGE_INCREASE : InventoryLog::CHANGE_DECREASE;
                    
                    InventoryLog::create([
                        'product_id' => $product->id,
                        'change_type' => $changeType,
                        'quantity_change' => abs($quantityChange),
                        'reason' => 'Product update',
                    ]);
                }
                
                return response()->json([
                    'success' => true,
                    'message' => 'Product updated successfully',
                    'data' => $product->fresh(),
                ]);
            });
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified product from storage.
     *
     * Deletes a product from the system.
     * Checks for product usage in orders before deletion.
     * Uses transaction to ensure data integrity.
     *
     * @param  int  $id  The product ID to delete
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        try {
            return DB::transaction(function () use ($id) {
                $product = Product::findOrFail($id);
                
                // Check if product is used in any orders
                $orderItemCount = DB::table('order_items')
                    ->where('product_id', $id)
                    ->count();
                
                if ($orderItemCount > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot delete product that is used in orders. Consider archiving instead.',
                        'data' => [
                            'order_count' => $orderItemCount
                        ]
                    ], 422);
                }
                
                // Delete related inventory logs
                InventoryLog::where('product_id', $id)->delete();
                
                // Delete the product
                $product->delete();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Product deleted successfully',
                ]);
            });
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display current stock levels of all products.
     *
     * Provides an overview of current inventory status.
     * Includes stock levels, value, and other inventory metrics.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function inventory(Request $request): JsonResponse
    {
        // Apply filters if provided
        $query = Product::query();
        
        // Filter by name or partial name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        
        // Filter by stock level
        if ($request->has('min_stock')) {
            $query->where('stock_quantity', '>=', $request->min_stock);
        }
        
        if ($request->has('max_stock')) {
            $query->where('stock_quantity', '<=', $request->max_stock);
        }
        
        // Get inventory data with calculated total value
        $inventory = $query->select(
            'id', 
            'name', 
            'stock_quantity',
            'price',
            DB::raw('stock_quantity * price as inventory_value')
        )->get();
        
        // Calculate total inventory value
        $totalValue = $inventory->sum('inventory_value');
        $totalItems = $inventory->sum('stock_quantity');
        
        return response()->json([
            'success' => true,
            'data' => [
                'inventory' => $inventory,
                'summary' => [
                    'total_value' => $totalValue,
                    'total_items' => $totalItems,
                    'product_count' => $inventory->count()
                ]
            ],
        ]);
    }

    /**
     * Update the stock quantity of a product.
     *
     * Directly updates a product's stock level with proper logging.
     * Uses transaction to ensure data integrity and prevent race conditions.
     *
     * @param  \App\Http\Requests\UpdateStockRequest  $request
     * @param  int  $id  The product ID to update stock for
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStock(UpdateStockRequest $request, $id): JsonResponse
    {
        try {
            return DB::transaction(function () use ($request, $id) {
                // Lock the product row for update to prevent race conditions
                $product = Product::where('id', $id)
                    ->lockForUpdate()
                    ->first();
                
                if (!$product) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Product not found',
                    ], 404);
                }

                $oldQuantity = $product->stock_quantity;
                $newQuantity = $request->stock_quantity;
                $quantityChange = $newQuantity - $oldQuantity;
                
                // If no change, return early
                if ($quantityChange == 0) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Stock quantity unchanged',
                        'data' => [
                            'id' => $product->id,
                            'name' => $product->name,
                            'stock_quantity' => $product->stock_quantity,
                        ],
                    ]);
                }
                
                // Update the stock and log the change
                $reason = $request->reason ?? 'Manual inventory update';
                $product->updateStock($quantityChange, $reason);

                return response()->json([
                    'success' => true,
                    'message' => 'Stock updated successfully',
                    'data' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'previous_quantity' => $oldQuantity,
                        'new_quantity' => $product->stock_quantity,
                        'change' => $quantityChange > 0 ? 'increase' : 'decrease',
                        'change_amount' => abs($quantityChange)
                    ],
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inventory logs for a specific product.
     * 
     * This endpoint retrieves the complete history of inventory changes for a product,
     * including stock increases, decreases, and adjustments. Each log entry contains
     * details about:
     * - Type of change (increase/decrease)
     * - Quantity changed
     * - Reason for the change (order, manual adjustment, etc.)
     * - Timestamp of the change
     * 
     * This provides full traceability of inventory movements for audit and
     * reconciliation purposes.
     *
     * @param  int  $id  The product ID to retrieve inventory logs for
     * @return \Illuminate\Http\JsonResponse
     */
    public function inventoryLogs($id): JsonResponse
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }
        
        $logs = InventoryLog::where('product_id', $id)
            ->latest('created_at')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => [
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'current_stock' => $product->stock_quantity
                ],
                'logs' => $logs
            ],
        ]);
    }
    
    /**
     * List products with low stock (below a specified threshold).
     *
     * Identifies products that need reordering based on threshold.
     * Useful for inventory management and preventing stockouts.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function lowStock(Request $request): JsonResponse
    {
        $threshold = $request->input('threshold', 10);
        
        if (!is_numeric($threshold) || $threshold < 0) {
            return response()->json([
                'success' => false,
                'message' => 'Threshold must be a non-negative number',
            ], 422);
        }
        
        $lowStockProducts = Product::where('stock_quantity', '<', $threshold)
            ->select(
                'id', 
                'name', 
                'stock_quantity',
                'price',
                DB::raw('stock_quantity * price as inventory_value')
            )
            ->orderBy('stock_quantity')
            ->get();
        
        // Calculate totals for the low stock items
        $totalValue = $lowStockProducts->sum('inventory_value');
        $outOfStockCount = $lowStockProducts->where('stock_quantity', 0)->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'products' => $lowStockProducts,
                'summary' => [
                    'low_stock_count' => $lowStockProducts->count(),
                    'out_of_stock_count' => $outOfStockCount,
                    'threshold_used' => $threshold,
                    'total_value_at_risk' => $totalValue
                ]
            ],
        ]);
    }
}
