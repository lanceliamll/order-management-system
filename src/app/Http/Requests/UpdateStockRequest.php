<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStockRequest extends FormRequest
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
            'stock_quantity' => 'required|integer|min:0',
            'reason' => 'required|string|max:255'
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
            'stock_quantity.required' => 'New stock quantity is required',
            'stock_quantity.integer' => 'Stock quantity must be a whole number',
            'stock_quantity.min' => 'Stock quantity cannot be negative',
            'reason.required' => 'A reason for the stock update is required for audit purposes',
            'reason.max' => 'Reason cannot exceed 255 characters'
        ];
    }
}
