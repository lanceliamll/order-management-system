<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'order_number',
        'status',
        'total_amount',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    /**
     * Get the order items for the order.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Generate a unique order number.
     */
    public static function generateOrderNumber(): string
    {
        $prefix = 'ORD-';
        $date = now()->format('Ymd');
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
        
        return $prefix . $date . '-' . $random;
    }
    
    /**
     * Check if the order is fully cancelled.
     */
    public function getIsFullyCancelledAttribute(): bool
    {
        // If status is explicitly set to cancelled
        if ($this->status === 'cancelled') {
            return true;
        }
        
        // Otherwise check all items
        if ($this->orderItems->isEmpty()) {
            return false;
        }
        
        // All items must be fully cancelled
        return $this->orderItems->every(fn($item) => $item->is_fully_cancelled);
    }
    
    /**
     * Check if the order is partially cancelled.
     */
    public function getIsPartiallyCancelledAttribute(): bool
    {
        // If the status is explicitly set
        if ($this->status === 'partially_cancelled') {
            return true;
        }
        
        // If any item has cancelled_quantity > 0 but not all items are fully cancelled
        $hasCancelledItems = $this->orderItems->contains(fn($item) => $item->cancelled_quantity > 0);
        
        return $hasCancelledItems && !$this->is_fully_cancelled;
    }
    
    /**
     * Calculate the active total (after cancellations).
     */
    public function calculateActiveTotal(): float
    {
        return $this->orderItems->sum(function ($item) {
            return ($item->quantity - $item->cancelled_quantity) * $item->unit_price;
        });
    }
    
    /**
     * Update order status based on cancellations
     */
    public function updateStatusBasedOnCancellations(): void
    {
        if ($this->is_fully_cancelled) {
            $this->status = 'cancelled';
        } else if ($this->is_partially_cancelled) {
            $this->status = 'partially_cancelled';
        }
        
        $this->save();
    }
}
