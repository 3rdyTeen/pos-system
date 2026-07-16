<?php

namespace App\Http\Requests\PurchaseOrder;

use App\Http\Requests\Concerns\ValidatesStockLines;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseOrderRequest extends FormRequest
{
    use ValidatesStockLines;

    /**
     * Get the validation rules that apply to the request.
     *
     * Money totals are derived by the service, never accepted here.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', Rule::exists('branches', 'id')],
            'warehouse_id' => ['required', Rule::exists('warehouses', 'id')],
            'supplier_id' => ['required', Rule::exists('suppliers', 'id')],
            'po_number' => [
                'nullable', 'string', 'max:50',
                Rule::unique('purchase_orders', 'po_number')->ignore($this->route('purchaseOrder')),
            ],
            'order_date' => ['nullable', 'date'],
            'expected_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['draft', 'ordered', 'partially_received', 'received', 'cancelled'])],
            'notes' => ['nullable', 'string', 'max:255'],

            // Omit `details` entirely to leave the existing lines and totals alone.
            'details' => ['sometimes', 'array'],
            'details.*.product_id' => ['required', Rule::exists('products', 'id')],
            'details.*.product_variant_id' => ['nullable', Rule::exists('product_variants', 'id'), $this->variantMatchesLineProduct()],
            'details.*.quantity' => ['required', 'numeric', 'gt:0'],
            'details.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'details.*.tax_amount' => ['nullable', 'numeric', 'min:0'],
            'details.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
