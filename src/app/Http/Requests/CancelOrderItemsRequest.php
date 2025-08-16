<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\OrderItem;
use App\Models\Order;

class CancelOrderItemsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization can be handled via middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.order_item_id' => [
                'required',
                'integer',
                Rule::exists('order_items', 'id')->where(function ($query) {
                    // Verify item belongs to the order being modified
                    $query->where('order_id', $this->route('id'));
                }),
            ],
            'items.*.quantity' => 'required|integer|min:1',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'items.required' => 'You must specify at least one item to cancel',
            'items.array' => 'The items must be provided as an array',
            'items.min' => 'You must specify at least one item to cancel',
            'items.*.order_item_id.required' => 'Each item must have an order_item_id',
            'items.*.order_item_id.exists' => 'One or more items do not exist or do not belong to this order',
            'items.*.quantity.required' => 'Each item must have a quantity to cancel',
            'items.*.quantity.integer' => 'Each item quantity must be a whole number',
            'items.*.quantity.min' => 'Each item quantity must be at least 1',
        ];
    }

    /**
     * Validate that the cancellation quantities don't exceed available quantities.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Skip if there are already errors
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $order = Order::find($this->route('id'));
            
            // Check if order is already cancelled
            if ($order && $order->status === 'cancelled') {
                $validator->errors()->add('order', 'This order has already been fully cancelled');
                return;
            }

            // Validate each item's cancellation quantity
            foreach ($this->items as $index => $item) {
                $orderItem = OrderItem::find($item['order_item_id']);
                
                if ($orderItem) {
                    $maxCancellable = $orderItem->quantity - $orderItem->cancelled_quantity;
                    
                    if ($item['quantity'] > $maxCancellable) {
                        $validator->errors()->add(
                            "items.{$index}.quantity", 
                            "Cannot cancel {$item['quantity']} units. Maximum cancellable: {$maxCancellable}"
                        );
                    }
                }
            }
        });
    }
}
