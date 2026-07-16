<?php

namespace App\Http\Requests\PurchaseOrder;

use App\Http\Requests\Concerns\ValidatesStockLines;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseOrderRequest extends FormRequest
{
    use ValidatesStockLines;

    /**
     * Get the validation rules that apply to the request.
     *
     * The money totals (subtotal/tax_total/discount_total/grand_total and each line's
     * line_total) are absent by design: the service derives them from the lines, so
     * accepting them here would let a client dictate what an order is worth.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', Rule::exists('branches', 'id')],
            'warehouse_id' => ['required', Rule::exists('warehouses', 'id')],
            'supplier_id' => ['required', Rule::exists('suppliers', 'id')],
            // Left out to let the service issue the next PO- number.
            'po_number' => ['nullable', 'string', 'max:50', Rule::unique('purchase_orders', 'po_number')],
            'order_date' => ['nullable', 'date'],
            'expected_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['draft', 'ordered', 'partially_received', 'received', 'cancelled'])],
            'notes' => ['nullable', 'string', 'max:255'],

            'details' => ['present', 'array'],
            'details.*.product_id' => ['required', Rule::exists('products', 'id')],
            'details.*.product_variant_id' => ['nullable', Rule::exists('product_variants', 'id'), $this->variantMatchesLineProduct()],
            'details.*.quantity' => ['required', 'numeric', 'gt:0'],
            'details.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'details.*.tax_amount' => ['nullable', 'numeric', 'min:0'],
            'details.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
