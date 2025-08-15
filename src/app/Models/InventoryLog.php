<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLog extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_id',
        'change_type',
        'quantity_change',
        'reason',
        'created_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Change type constants
     */
    const CHANGE_ADDITION = 'addition';
    const CHANGE_DEDUCTION = 'deduction';
    const CHANGE_RESTORE = 'restore';

    /**
     * Reason constants
     */
    const REASON_ORDER_CONFIRMED = 'order_confirmed';
    const REASON_ORDER_CANCELLED = 'order_cancelled';
    const REASON_MANUAL_UPDATE = 'manual_update';
    const REASON_STOCK_CORRECTION = 'stock_correction';
    const REASON_INITIAL_STOCK = 'initial_stock';
    
    /**
     * Get the product that owns the inventory log.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
    
    /**
     * Log an inventory change
     *
     * @param int $productId
     * @param string $changeType
     * @param int $quantityChange
     * @param string $reason
     * @return InventoryLog
     */
    public static function logChange(int $productId, string $changeType, int $quantityChange, string $reason): InventoryLog
    {
        return self::create([
            'product_id' => $productId,
            'change_type' => $changeType,
            'quantity_change' => abs($quantityChange), // Always store as positive number
            'reason' => $reason,
            'created_at' => now()
        ]);
    }
}
