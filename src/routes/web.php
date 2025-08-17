<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    Route::get('orders', function () {
        return Inertia::render('orders');
    })->name('orders');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// Direct product routes for testing (without API prefix)
use App\Http\Controllers\Api\ProductController;

Route::prefix('products')->group(function () {
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
