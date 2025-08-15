<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'stock_quantity',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
    ];
    
    /**
     * Get the order items for the product.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
    
    /**
     * Get the inventory logs for the product.
     */
    public function inventoryLogs(): HasMany
    {
        return $this->hasMany(InventoryLog::class);
    }
    
    /**
     * Update the product stock quantity.
     * 
     * @param int $quantity The quantity to add/remove (negative for removal)
     * @param string $reason The reason for the stock change
     * @return bool
     */
    public function updateStock(int $quantity, string $reason = InventoryLog::REASON_MANUAL_UPDATE): bool
    {
        if ($quantity < 0 && abs($quantity) > $this->stock_quantity) {
            return false; // Not enough stock
        }
        
        // Determine the change type based on quantity
        $changeType = $quantity > 0 ? 
            InventoryLog::CHANGE_ADDITION : 
            ($reason === InventoryLog::REASON_ORDER_CANCELLED ? 
                InventoryLog::CHANGE_RESTORE : 
                InventoryLog::CHANGE_DEDUCTION);
        
        // Update the stock
        $this->stock_quantity += $quantity;
        $saved = $this->save();
        
        // Log the change if successful
        if ($saved) {
            InventoryLog::logChange(
                $this->id, 
                $changeType, 
                abs($quantity), 
                $reason
            );
        }
        
        return $saved;
    }
}
