<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'cancelled_quantity',
        'unit_price',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
        'cancelled_quantity' => 'integer',
    ];

    /**
     * Get the order that owns the order item.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the product that the order item belongs to.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Calculate the subtotal for this order item.
     */
    public function getSubtotalAttribute(): float
    {
        return ($this->quantity - $this->cancelled_quantity) * $this->unit_price;
    }
    
    /**
     * Get the active quantity (total quantity minus cancelled quantity)
     */
    public function getActiveQuantityAttribute(): int
    {
        return max(0, $this->quantity - $this->cancelled_quantity);
    }
    
    /**
     * Check if the order item is fully cancelled
     */
    public function getIsFullyCancelledAttribute(): bool
    {
        return $this->cancelled_quantity >= $this->quantity;
    }
}
