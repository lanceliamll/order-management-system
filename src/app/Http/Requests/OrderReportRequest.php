<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;

class OrderReportRequest extends FormRequest
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
            'from_date' => 'nullable|date_format:Y-m-d',
            'to_date' => 'nullable|date_format:Y-m-d|after_or_equal:from_date',
            'status' => 'nullable|string|in:pending,confirmed,cancelled,partially_cancelled',
            'group_by' => 'nullable|string|in:day,week,month,year',
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
            'from_date.date_format' => 'The from date must be in YYYY-MM-DD format',
            'to_date.date_format' => 'The to date must be in YYYY-MM-DD format',
            'to_date.after_or_equal' => 'The to date must be after or equal to the from date',
            'status.in' => 'Status must be one of: pending, confirmed, cancelled, partially_cancelled',
            'group_by.in' => 'Group by must be one of: day, week, month, year',
        ];
    }

    /**
     * Prepare the data for validation.
     * 
     * @return void
     */
    protected function prepareForValidation()
    {
        // Set default to_date to today if not provided
        if ($this->filled('from_date') && !$this->filled('to_date')) {
            $this->merge([
                'to_date' => Carbon::now()->format('Y-m-d')
            ]);
        }
    }
}
