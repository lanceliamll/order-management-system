<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrderReportRequest;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\OrderLog;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

/**
 * Class ReportController
 * 
 * Provides endpoints for retrieving various business intelligence reports
 * including order summaries, inventory status, revenue calculations,
 * and activity logs.
 * 
 * This controller implements caching strategies for performance optimization
 * and handles large datasets efficiently.
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
     * Results are cached for performance optimization.
     * 
     * @param  \App\Http\Requests\OrderReportRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function orderSummary(OrderReportRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date');
            $toDate = $request->input('to_date', now()->format('Y-m-d'));
            $status = $request->input('status');
            
            // Create a cache key based on the request parameters
            $cacheKey = "order_summary:{$fromDate}:{$toDate}:" . ($status ?? 'all');
            
            // Try to get from cache first (5 minute TTL)
            return Cache::remember($cacheKey, 300, function () use ($fromDate, $toDate, $status) {
                $query = Order::query();
                
                // Add date filtering if provided
                if ($fromDate) {
                    $query->whereBetween('created_at', [
                        $fromDate . ' 00:00:00', 
                        $toDate . ' 23:59:59'
                    ]);
                }
                
                // Add status filtering if provided
                if ($status) {
                    $query->where('status', $status);
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
                    ->when($status, function ($q) use ($status) {
                        return $q->where('status', $status);
                    })
                    ->when($fromDate, function ($q) use ($fromDate, $toDate) {
                        return $q->whereBetween('created_at', [
                            $fromDate . ' 00:00:00', 
                            $toDate . ' 23:59:59'
                        ]);
                    })
                    ->latest()
                    ->take(5)
                    ->get();
                
                // Include date parameters in response
                $dateRange = $fromDate ? [
                    'from_date' => $fromDate,
                    'to_date' => $toDate
                ] : [
                    'all_time' => true
                ];
                
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'date_range' => $dateRange,
                        'status_filter' => $status ?? 'all',
                        'summary_by_status' => $summary,
                        'total_orders' => $totalOrders,
                        'total_revenue' => $totalRevenue,
                        'recent_orders' => $recentOrders
                    ]
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate order summary',
                'error' => $e->getMessage()
            ], 500);
        }
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
     * The low stock threshold is configurable via request parameter.
     * Results are cached for performance optimization.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function inventoryStatus(Request $request): JsonResponse
    {
        try {
            // Get threshold from request or use default
            $lowStockThreshold = $request->input('threshold', 10);
            
            if (!is_numeric($lowStockThreshold) || $lowStockThreshold < 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Threshold must be a non-negative number'
                ], 422);
            }
            
            // Create cache key based on threshold
            $cacheKey = "inventory_status:threshold_{$lowStockThreshold}";
            
            // Cache for 5 minutes
            return Cache::remember($cacheKey, 300, function () use ($lowStockThreshold) {
                // Get overall inventory stats with optimized query
                $inventoryStats = DB::table('products')
                    ->select(
                        DB::raw('COUNT(*) as total_products'),
                        DB::raw('SUM(price * stock_quantity) as total_inventory_value'),
                        DB::raw('SUM(CASE WHEN stock_quantity < ' . $lowStockThreshold . ' THEN 1 ELSE 0 END) as low_stock_count'),
                        DB::raw('SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count')
                    )
                    ->first();
                
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
                
                // Calculate total at-risk value (low stock items value)
                $atRiskValue = $lowStockProducts->sum(function($product) {
                    return $product->stock_quantity * $product->price;
                });
                
                // Format final response
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'total_products' => $inventoryStats->total_products,
                        'total_inventory_value' => $inventoryStats->total_inventory_value,
                        'low_stock_count' => $inventoryStats->low_stock_count,
                        'out_of_stock_count' => $inventoryStats->out_of_stock_count,
                        'low_stock_threshold' => $lowStockThreshold,
                        'at_risk_value' => $atRiskValue,
                        'low_stock_products' => $lowStockProducts,
                        'recent_activities' => $recentActivities
                    ]
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate inventory status',
                'error' => $e->getMessage()
            ], 500);
        }
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
     * Results are cached for performance optimization.
     * 
     * @param  \App\Http\Requests\RevenueReportRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function revenueReport(RevenueReportRequest $request): JsonResponse
    {
        try {
            $period = $request->input('period', 'monthly');
            $year = $request->input('year', now()->year);
            $month = $request->input('month', now()->month);
            
            // Create cache key based on report parameters
            $cacheKey = "revenue_report:{$period}:{$year}:" . ($period === 'daily' ? $month : 'all');
            
            // Cache for 15 minutes
            return Cache::remember($cacheKey, 900, function () use ($period, $year, $month) {
                // Base query - only include confirmed or partially cancelled orders
                $query = Order::where(function($q) {
                    $q->where('status', '=', 'confirmed')
                      ->orWhere('status', '=', 'partially_cancelled');
                });
                
                // Format for grouping based on period
                switch ($period) {
                    case 'daily':
                        $dateFormat = '%Y-%m-%d';
                        $dateFormatLabel = 'Date';
                        $query->whereYear('created_at', $year)
                              ->whereMonth('created_at', $month);
                        break;
                    case 'weekly':
                        $dateFormat = '%Y-%u'; // Year and week number
                        $dateFormatLabel = 'Week';
                        $query->whereYear('created_at', $year);
                        break;
                    case 'yearly':
                        $dateFormat = '%Y';
                        $dateFormatLabel = 'Year';
                        break;
                    case 'monthly':
                    default:
                        $dateFormat = '%Y-%m';
                        $dateFormatLabel = 'Month';
                        $query->whereYear('created_at', $year);
                        break;
                }
                
                // Get revenue grouped by period
                $groupedRevenue = $query->select(
                        DB::raw("DATE_FORMAT(created_at, '$dateFormat') as period"),
                        DB::raw('SUM(total_amount) as total_revenue'),
                        DB::raw('COUNT(*) as order_count')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                
                // Get total for the period
                $totalRevenue = $groupedRevenue->sum('total_revenue');
                $totalOrders = $groupedRevenue->sum('order_count');
                
                // Get top products by revenue with optimized query
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
                    ->when($period === 'daily', function ($q) use ($year, $month) {
                        return $q->whereYear('orders.created_at', $year)
                                 ->whereMonth('orders.created_at', $month);
                    })
                    ->when($period !== 'daily' && $period !== 'yearly', function ($q) use ($year) {
                        return $q->whereYear('orders.created_at', $year);
                    })
                    ->groupBy('products.id', 'products.name')
                    ->orderByDesc('revenue')
                    ->take(10)
                    ->get();
                
                // Enhance with growth metrics if possible
                $growthMetrics = [];
                if ($period === 'monthly' && $year > 2020) {
                    // Get previous year's data for comparison
                    $previousYearTotal = Order::whereYear('created_at', $year - 1)
                        ->whereIn('status', ['confirmed', 'partially_cancelled'])
                        ->sum('total_amount');
                    
                    if ($previousYearTotal > 0) {
                        $yearOverYearGrowth = (($totalRevenue - $previousYearTotal) / $previousYearTotal) * 100;
                        $growthMetrics['year_over_year_growth'] = round($yearOverYearGrowth, 2);
                    }
                }
                
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'period' => $period,
                        'period_label' => $dateFormatLabel,
                        'year' => $year,
                        'month' => $period === 'daily' ? $month : null,
                        'period_data' => $groupedRevenue,
                        'total_revenue' => $totalRevenue,
                        'total_orders' => $totalOrders,
                        'growth_metrics' => $growthMetrics,
                        'top_products' => $topProducts
                    ]
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate revenue report',
                'error' => $e->getMessage()
            ], 500);
        }
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
