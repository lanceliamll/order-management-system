<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// API Routes for authenticated users
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Product API Routes - Using the 'api' middleware group
Route::prefix('products')
    ->middleware('api') // Apply the API middleware group which disables CSRF protection
    ->group(function () {
        // Inventory specific endpoints - these need to come BEFORE the dynamic routes
        Route::get('inventory/all', [ProductController::class, 'inventory']);
        Route::get('inventory/low-stock', [ProductController::class, 'lowStock']);
        
        // Basic CRUD operations
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
        
        // Routes with dynamic parameters come last
        Route::put('{id}/stock', [ProductController::class, 'updateStock']);
        Route::get('{id}', [ProductController::class, 'show']);
        Route::put('{id}', [ProductController::class, 'update']);
        Route::delete('{id}', [ProductController::class, 'destroy']);
    });
