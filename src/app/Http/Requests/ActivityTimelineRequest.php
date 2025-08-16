<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ActivityTimelineRequest extends FormRequest
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
            'type' => 'nullable|string|in:order,inventory',
            'id' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'from_date' => 'nullable|date_format:Y-m-d',
            'to_date' => 'nullable|date_format:Y-m-d|after_or_equal:from_date',
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
            'type.in' => 'Type must be either "order" or "inventory"',
            'id.integer' => 'ID must be a valid integer',
            'id.min' => 'ID must be a positive number',
            'limit.integer' => 'Limit must be a valid integer',
            'limit.min' => 'Limit must be at least 1',
            'limit.max' => 'Limit cannot exceed 100 for performance reasons',
            'from_date.date_format' => 'From date must be in YYYY-MM-DD format',
            'to_date.date_format' => 'To date must be in YYYY-MM-DD format',
            'to_date.after_or_equal' => 'To date must be after or equal to from date',
        ];
    }

    /**
     * Prepare the data for validation.
     * 
     * @return void
     */
    protected function prepareForValidation()
    {
        $mergeData = [];
        
        // Set defaults if not provided
        if (!$this->filled('type')) {
            $mergeData['type'] = 'order';
        }
        
        if (!$this->filled('limit')) {
            $mergeData['limit'] = 20;
        }
        
        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }
}
