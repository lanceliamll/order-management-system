<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0.01|regex:/^\d+(\.\d{1,2})?$/', // Allow only valid price format with up to 2 decimal places
            'stock_quantity' => 'required|integer|min:0',
            'category' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:50|unique:products,sku'
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
            'name.required' => 'A product name is required',
            'name.max' => 'Product name cannot exceed 255 characters',
            'price.required' => 'A product price is required',
            'price.numeric' => 'Price must be a valid number',
            'price.min' => 'Price must be at least 0.01',
            'price.regex' => 'Price must have at most 2 decimal places',
            'stock_quantity.required' => 'Initial stock quantity is required',
            'stock_quantity.integer' => 'Stock quantity must be a whole number',
            'stock_quantity.min' => 'Stock quantity cannot be negative',
            'sku.unique' => 'This SKU is already in use by another product'
        ];
    }
}
