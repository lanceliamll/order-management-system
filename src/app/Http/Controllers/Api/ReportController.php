<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Class ReportController
 * 
 * Provides endpoints for retrieving various business intelligence reports
 * including order summaries, inventory status, revenue calculations,
 * and activity logs.
 * 
 * @package App\Http\Controllers\Api
 */
class ReportController extends Controller
{
    /**
     * Get a summary of orders (counts and totals by status).
     * 
     * This endpoint returns aggregated order data including:
     * - Order counts and totals by status
     * - Overall totals across all statuses
     * - A list of recent orders for quick reference
     * 
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $request->from_date  Optional date filter (YYYY-MM-DD)
     * @param  string  $request->to_date    Optional end date filter (YYYY-MM-DD)
     * @return \Illuminate\Http\JsonResponse
     */
    public function orderSummary(Request $request): JsonResponse
    {
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date', now()->format('Y-m-d'));
        
        $query = Order::query();
        
        // Add date filtering if provided
        if ($fromDate) {
            $query->whereBetween('created_at', [$fromDate, $toDate . ' 23:59:59']);
        }
        
        // Get summary by status
        $summary = $query->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as total_amount'))
            ->groupBy('status')
            ->get();
        
        // Get overall totals
        $totalOrders = $summary->sum('count');
        $totalRevenue = $summary->sum('total_amount');
        
        // Get recent orders
        $recentOrders = Order::with('orderItems')
            ->latest()
            ->take(5)
            ->get();
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'summary_by_status' => $summary,
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
                'recent_orders' => $recentOrders
            ]
        ]);
    }
    
    /**
     * Get inventory status overview (current stock levels, low stock items).
     * 
     * This endpoint provides a comprehensive overview of the current inventory status:
     * - Overall inventory statistics (product count, total value)
     * - Low stock and out-of-stock counts
     * - List of products with critically low inventory
     * - Recent inventory activities for monitoring changes
     * 
     * The low stock threshold is currently set to 10 units.
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function inventoryStatus(): JsonResponse
    {
        // Get overall inventory stats
        $totalProducts = Product::count();
        $totalInventoryValue = Product::sum(DB::raw('price * stock_quantity'));
        $lowStockThreshold = 10;
        $lowStockCount = Product::where('stock_quantity', '<', $lowStockThreshold)->count();
        $outOfStockCount = Product::where('stock_quantity', '=', 0)->count();
        
        // Get top 10 low stock products
        $lowStockProducts = Product::where('stock_quantity', '<', $lowStockThreshold)
            ->orderBy('stock_quantity')
            ->take(10)
            ->get(['id', 'name', 'stock_quantity', 'price']);
        
        // Get recent inventory activities
        $recentActivities = InventoryLog::with('product:id,name')
            ->latest('created_at')
            ->take(10)
            ->get();
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'total_products' => $totalProducts,
                'total_inventory_value' => $totalInventoryValue,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'low_stock_threshold' => $lowStockThreshold,
                'low_stock_products' => $lowStockProducts,
                'recent_activities' => $recentActivities
            ]
        ]);
    }
    
    /**
     * Get revenue calculations (daily, monthly, by product category).
     * 
     * This endpoint provides revenue analytics with flexible time period filtering:
     * - Revenue and order counts grouped by day or month
     * - Total revenue and order counts for the selected period
     * - Top-selling products by revenue for business insights
     * 
     * Revenue calculations only include confirmed or partially cancelled orders,
     * ensuring accurate financial reporting.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $request->period  Optional grouping period ('daily' or 'monthly', default: 'monthly')
     * @param  int     $request->year    Optional year filter (YYYY, default: current year)
     * @param  int     $request->month   Optional month filter (1-12, default: current month)
     * @return \Illuminate\Http\JsonResponse
     */
    public function revenueReport(Request $request): JsonResponse
    {
        $period = $request->input('period', 'monthly');
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        
        // Base query
        $query = Order::where('status', '=', 'confirmed')
            ->orWhere('status', '=', 'partially_cancelled');
        
        // Format for grouping
        $dateFormat = $period === 'daily' ? '%Y-%m-%d' : '%Y-%m';
        $dateFormatLabel = $period === 'daily' ? 'Date' : 'Month';
        
        // Apply filters based on period
        if ($period === 'daily') {
            // Daily revenue for specified month
            $query->whereYear('created_at', $year)
                ->whereMonth('created_at', $month);
            
            $groupedRevenue = $query->select(
                    DB::raw("DATE_FORMAT(created_at, '$dateFormat') as period"),
                    DB::raw('SUM(total_amount) as total_revenue'),
                    DB::raw('COUNT(*) as order_count')
                )
                ->groupBy('period')
                ->orderBy('period')
                ->get();
        } else {
            // Monthly revenue for specified year
            $query->whereYear('created_at', $year);
            
            $groupedRevenue = $query->select(
                    DB::raw("DATE_FORMAT(created_at, '$dateFormat') as period"),
                    DB::raw('SUM(total_amount) as total_revenue'),
                    DB::raw('COUNT(*) as order_count')
                )
                ->groupBy('period')
                ->orderBy('period')
                ->get();
        }
        
        // Get total for the period
        $totalRevenue = $groupedRevenue->sum('total_revenue');
        $totalOrders = $groupedRevenue->sum('order_count');
        
        // Get top products by revenue
        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(order_items.quantity * order_items.unit_price) as revenue'),
                DB::raw('SUM(order_items.quantity) as units_sold')
            )
            ->whereIn('orders.status', ['confirmed', 'partially_cancelled'])
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->take(10)
            ->get();
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'period' => $period,
                'period_label' => $dateFormatLabel,
                'period_data' => $groupedRevenue,
                'total_revenue' => $totalRevenue,
                'total_orders' => $totalOrders,
                'top_products' => $topProducts
            ]
        ]);
    }
    
    /**
     * Get activity timeline/history for orders or products.
     * 
     * This endpoint provides a chronological timeline of activities for monitoring
     * and auditing purposes. It supports two types of activities:
     * 
     * 1. Order activities: Tracks order creation, confirmation, cancellation events
     * 2. Inventory activities: Tracks stock changes, adjustments, and related events
     * 
     * Results can be filtered by specific order or product and limited to control 
     * the result set size.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $request->type    Optional activity type filter ('order' or 'inventory', default: 'order')
     * @param  int     $request->id      Optional filter by specific order_id or product_id
     * @param  int     $request->limit   Optional limit on number of results (default: 20)
     * @return \Illuminate\Http\JsonResponse
     */
    public function activityTimeline(Request $request): JsonResponse
    {
        $type = $request->input('type', 'order'); // 'order' or 'inventory'
        $id = $request->input('id'); // order_id or product_id
        $limit = $request->input('limit', 20);
        
        if ($type === 'order') {
            // Get order activity logs
            $activities = OrderLog::with('order')
                ->when($id, function($query) use ($id) {
                    $query->where('order_id', $id);
                })
                ->latest('created_at')
                ->take($limit)
                ->get();
                
            // Transform for easier frontend rendering
            $formattedActivities = $activities->map(function($log) {
                return [
                    'id' => $log->id,
                    'order_number' => $log->order->order_number,
                    'activity_type' => $log->activity_type,
                    'details' => $log->details,
                    'date' => $log->created_at->format('Y-m-d H:i:s'),
                    'user_id' => $log->user_id
                ];
            });
        } else {
            // Get inventory activity logs
            $activities = InventoryLog::with('product')
                ->when($id, function($query) use ($id) {
                    $query->where('product_id', $id);
                })
                ->latest('created_at')
                ->take($limit)
                ->get();
                
            // Transform for easier frontend rendering
            $formattedActivities = $activities->map(function($log) {
                return [
                    'id' => $log->id,
                    'product_name' => $log->product->name,
                    'change_type' => $log->change_type,
                    'quantity_change' => $log->quantity_change,
                    'reason' => $log->reason,
                    'date' => $log->created_at->format('Y-m-d H:i:s')
                ];
            });
        }
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'type' => $type,
                'activities' => $formattedActivities
            ]
        ]);
    }
}
