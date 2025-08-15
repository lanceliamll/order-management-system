<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryLog;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * Display a listing of all products.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(): JsonResponse
    {
        $products = Product::all();
        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Store a newly created product in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
        ]);

        $product = Product::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product,
        ], 201);
    }

    /**
     * Display the specified product.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id): JsonResponse
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Update the specified product in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        $validatedData = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
        ]);

        $product->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product,
        ]);
    }

    /**
     * Remove the specified product from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }

    /**
     * Display current stock levels of all products.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function inventory(): JsonResponse
    {
        $inventory = Product::select('id', 'name', 'stock_quantity')->get();
        
        return response()->json([
            'success' => true,
            'data' => $inventory,
        ]);
    }

    /**
     * Update the stock quantity of a product.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStock(Request $request, $id): JsonResponse
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        $validatedData = $request->validate([
            'stock_quantity' => 'required|integer|min:0',
            'reason' => 'nullable|string'
        ]);

        $oldQuantity = $product->stock_quantity;
        $newQuantity = $validatedData['stock_quantity'];
        $quantityChange = $newQuantity - $oldQuantity;
        $reason = $validatedData['reason'] ?? 'Manual inventory update';
        
        // Update the stock and log the change
        $product->updateStock($quantityChange, $reason);

        return response()->json([
            'success' => true,
            'message' => 'Stock updated successfully',
            'data' => [
                'id' => $product->id,
                'name' => $product->name,
                'stock_quantity' => $product->stock_quantity,
            ],
        ]);
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
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function lowStock(Request $request): JsonResponse
    {
        $threshold = $request->input('threshold', 10);
        
        $lowStockProducts = Product::where('stock_quantity', '<', $threshold)
            ->select('id', 'name', 'stock_quantity')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $lowStockProducts,
        ]);
    }
}
