<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RevenueReportRequest extends FormRequest
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
        $rules = [
            'period' => 'nullable|string|in:daily,weekly,monthly,yearly',
            'year' => 'nullable|integer|min:2020|max:' . (date('Y') + 1),
        ];
        
        // Month validation only required when period is daily
        if ($this->input('period') === 'daily') {
            $rules['month'] = 'required|integer|min:1|max:12';
        } else {
            $rules['month'] = 'nullable|integer|min:1|max:12';
        }
        
        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'period.in' => 'Period must be one of: daily, weekly, monthly, yearly',
            'year.integer' => 'Year must be a valid year',
            'year.min' => 'Year must be 2020 or later',
            'year.max' => 'Year cannot be more than one year in the future',
            'month.required' => 'Month is required when using daily period',
            'month.integer' => 'Month must be a valid month number (1-12)',
            'month.min' => 'Month must be between 1 and 12',
            'month.max' => 'Month must be between 1 and 12',
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
        if (!$this->filled('period')) {
            $mergeData['period'] = 'monthly';
        }
        
        if (!$this->filled('year')) {
            $mergeData['year'] = date('Y');
        }
        
        if (!$this->filled('month') && $this->input('period') === 'daily') {
            $mergeData['month'] = date('n');
        }
        
        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }
}
