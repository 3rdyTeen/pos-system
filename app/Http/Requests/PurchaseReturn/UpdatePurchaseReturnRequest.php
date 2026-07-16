<?php

namespace App\Http\Requests\PurchaseReturn;

use App\Http\Requests\Concerns\ValidatesStockLines;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseReturnRequest extends FormRequest
{
    use ValidatesStockLines;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'purchase_order_id' => ['required', Rule::exists('purchase_orders', 'id')],
            'branch_id' => ['required', Rule::exists('branches', 'id')],
            'return_number' => [
                'nullable', 'string', 'max:50',
                Rule::unique('purchase_returns', 'return_number')->ignore($this->route('purchaseReturn')),
            ],
            'return_date' => ['nullable', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['pending', 'completed', 'cancelled'])],

            // Omit `details` entirely to leave the existing lines and total alone.
            'details' => ['sometimes', 'array'],
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
