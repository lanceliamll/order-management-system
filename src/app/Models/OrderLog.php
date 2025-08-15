<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderLog extends Model
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
        'order_id',
        'activity_type',
        'details',
        'user_id',
        'created_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'details' => 'json',
        'created_at' => 'datetime',
    ];

    /**
     * Activity type constants
     */
    const ACTIVITY_CREATED = 'created';
    const ACTIVITY_CONFIRMED = 'confirmed';
    const ACTIVITY_CANCELLED = 'cancelled';
    const ACTIVITY_PARTIALLY_CANCELLED = 'partially_cancelled';
    const ACTIVITY_UPDATED = 'updated';
    
    /**
     * Get the order that owns the log entry.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
    
    /**
     * Log an order activity
     *
     * @param int $orderId
     * @param string $activityType
     * @param array|null $details
     * @param int|null $userId
     * @return OrderLog
     */
    public static function log(int $orderId, string $activityType, array $details = null, int $userId = null): OrderLog
    {
        return self::create([
            'order_id' => $orderId,
            'activity_type' => $activityType,
            'details' => $details,
            'user_id' => $userId,
            'created_at' => now()
        ]);
    }
}
