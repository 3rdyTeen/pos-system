<?php

namespace App\Http\Requests\PurchaseReturn;

use App\Http\Requests\Concerns\ValidatesStockLines;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseReturnRequest extends FormRequest
{
    use ValidatesStockLines;

    /**
     * Get the validation rules that apply to the request.
     *
     * `total_amount` and each line's `line_total` are derived by the service.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'purchase_order_id' => ['required', Rule::exists('purchase_orders', 'id')],
            'branch_id' => ['required', Rule::exists('branches', 'id')],
            // Left out to let the service issue the next PR- number.
            'return_number' => ['nullable', 'string', 'max:50', Rule::unique('purchase_returns', 'return_number')],
            'return_date' => ['nullable', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['pending', 'completed', 'cancelled'])],

            'details' => ['present', 'array'],
            // Scoped to the order being returned against, so a line cannot reference
            // some other order's detail row.
            'details.*.purchase_detail_id' => [
                'nullable',
                Rule::exists('purchase_details', 'id')->where('purchase_order_id', $this->input('purchase_order_id')),
            ],
            'details.*.product_id' => ['required', Rule::exists('products', 'id')],
            'details.*.product_variant_id' => ['nullable', Rule::exists('product_variants', 'id'), $this->variantMatchesLineProduct()],
            'details.*.quantity' => ['required', 'numeric', 'gt:0'],
            'details.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ];
    }
}
