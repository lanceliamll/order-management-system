<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true; // Anyone can create an order
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'products' => 'required|array',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.quantity' => 'required|integer|min:1',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages()
    {
        return [
            'products.required' => 'At least one product is required to create an order',
            'products.*.product_id.required' => 'A product ID is required for each item',
            'products.*.product_id.exists' => 'The selected product does not exist',
            'products.*.quantity.required' => 'Quantity is required for each product',
            'products.*.quantity.integer' => 'Quantity must be a whole number',
            'products.*.quantity.min' => 'Quantity must be at least 1',
        ];
    }
}
