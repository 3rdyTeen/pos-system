<?php

namespace App\Http\Requests\Sale;

use App\Http\Requests\Concerns\ValidatesStockLines;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Ring up or park a sale.
 *
 * The totals (subtotal, tax_total, grand_total, amount_paid, amount_due) are
 * deliberately absent: accepting them here would let a client dictate what a sale
 * is worth. SaleService prices the cart from the catalogue instead.
 */
class StoreSaleRequest extends FormRequest
{
    use ValidatesStockLines;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', Rule::exists('branches', 'id')],
            'warehouse_id' => ['nullable', Rule::exists('warehouses', 'id')],
            'register_id' => ['nullable', Rule::exists('registers', 'id')],
            'shift_id' => ['nullable', Rule::exists('shifts', 'id')],
            'customer_id' => ['nullable', Rule::exists('customers', 'id')],
            'sale_number' => ['nullable', 'string', 'max:50', Rule::unique('sales', 'sale_number')],
            'order_type' => ['nullable', 'string', 'max:30'],
            'status' => ['required', Rule::in(['draft', 'completed', 'held'])],
            'notes' => ['nullable', 'string', 'max:255'],

            'lines' => ['present', 'array', 'min:1'],
            'lines.*.product_id' => ['required', Rule::exists('products', 'id')],
            'lines.*.product_variant_id' => ['nullable', Rule::exists('product_variants', 'id'), $this->variantMatchesLineProduct()],
            'lines.*.unit_id' => ['nullable', Rule::exists('units', 'id')],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
            // Optional: a manual price entry overrides the catalogue price. Omit it
            // and the product's selling_price is used.
            'lines.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'lines.*.discount_amount' => ['nullable', 'numeric', 'min:0'],

            // Which options were picked. Only the ids travel — SaleLinePricer reads
            // the names and prices off the catalogue and checks they are actually
            // offered on this product.
            'lines.*.modifiers' => ['nullable', 'array'],
            'lines.*.modifiers.*' => [Rule::exists('modifier_options', 'id')],

            // Which product fills each combo slot.
            'lines.*.components' => ['nullable', 'array'],
            'lines.*.components.*.combo_slot_option_id' => ['required', Rule::exists('combo_slot_options', 'id')],

            'payments' => ['nullable', 'array'],
            'payments.*.payment_method_id' => ['required', Rule::exists('payment_methods', 'id')],
            'payments.*.amount' => ['required', 'numeric', 'gt:0'],
            'payments.*.reference_number' => ['nullable', 'string', 'max:100'],
        ];
    }
}
