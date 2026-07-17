<?php

namespace App\Http\Requests\SalesReturn;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSalesReturnRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'return_number' => [
                'nullable', 'string', 'max:50',
                Rule::unique('sales_returns', 'return_number')->ignore($this->route('salesReturn')),
            ],
            'return_date' => ['nullable', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'refund_method' => ['nullable', 'string', 'max:50'],
            'status' => ['sometimes', Rule::in(['pending', 'completed', 'cancelled'])],

            // `sometimes`: omitting lines leaves them alone.
            'lines' => ['sometimes', 'array', 'min:1'],
            'lines.*.sales_detail_id' => ['required', Rule::exists('sales_details', 'id')],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
        ];
    }
}
