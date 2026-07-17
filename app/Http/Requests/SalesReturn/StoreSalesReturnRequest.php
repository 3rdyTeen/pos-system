<?php

namespace App\Http\Requests\SalesReturn;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Raise a refund against a completed sale.
 *
 * Neither `unit_price` nor `total_amount` is accepted: a refund pays back what was
 * actually charged, so SalesReturnService reads the price off the original sale line.
 */
class StoreSalesReturnRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'sale_id' => ['required', Rule::exists('sales', 'id')],
            'branch_id' => ['nullable', Rule::exists('branches', 'id')],
            'return_number' => ['nullable', 'string', 'max:50', Rule::unique('sales_returns', 'return_number')],
            'return_date' => ['nullable', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'refund_method' => ['nullable', 'string', 'max:50'],
            'status' => ['required', Rule::in(['pending', 'completed', 'cancelled'])],

            'lines' => ['present', 'array', 'min:1'],
            'lines.*.sales_detail_id' => ['required', Rule::exists('sales_details', 'id')],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
        ];
    }
}
