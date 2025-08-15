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
     * Update the product stock quantity.
     * 
     * @param int $quantity The quantity to add/remove (negative for removal)
     * @return bool
     */
    public function updateStock(int $quantity): bool
    {
        if ($quantity < 0 && abs($quantity) > $this->stock_quantity) {
            return false; // Not enough stock
        }
        
        $this->stock_quantity += $quantity;
        return $this->save();
    }
}
