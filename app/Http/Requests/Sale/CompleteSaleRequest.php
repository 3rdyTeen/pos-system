<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Take payment for a parked cart.
 *
 * `amount` is the amount applied to the sale, not the cash tendered — change is
 * not a tender. SaleService rejects payments that total more than the sale.
 */
class CompleteSaleRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'payments' => ['present', 'array', 'min:1'],
            'payments.*.payment_method_id' => ['required', Rule::exists('payment_methods', 'id')],
            'payments.*.amount' => ['required', 'numeric', 'gt:0'],
            'payments.*.reference_number' => ['nullable', 'string', 'max:100'],
        ];
    }
}
