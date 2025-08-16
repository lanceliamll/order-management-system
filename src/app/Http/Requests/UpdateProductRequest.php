<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
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
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0.01|regex:/^\d+(\.\d{1,2})?$/', // Allow only valid price format
            'stock_quantity' => 'sometimes|integer|min:0',
            'category' => 'nullable|string|max:100',
            'sku' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('products', 'sku')->ignore($this->route('id')),
            ]
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
            'name.max' => 'Product name cannot exceed 255 characters',
            'price.numeric' => 'Price must be a valid number',
            'price.min' => 'Price must be at least 0.01',
            'price.regex' => 'Price must have at most 2 decimal places',
            'stock_quantity.integer' => 'Stock quantity must be a whole number',
            'stock_quantity.min' => 'Stock quantity cannot be negative',
            'sku.unique' => 'This SKU is already in use by another product'
        ];
    }
}
