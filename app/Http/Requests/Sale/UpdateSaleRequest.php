<?php

namespace App\Http\Requests\Sale;

use App\Http\Requests\Concerns\ValidatesStockLines;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Amend a parked cart. Only a held or draft sale reaches this — SaleService
 * refuses anything further along.
 */
class UpdateSaleRequest extends FormRequest
{
    use ValidatesStockLines;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', Rule::exists('customers', 'id')],
            'order_type' => ['nullable', 'string', 'max:30'],
            'status' => ['sometimes', Rule::in(['draft', 'held'])],
            'notes' => ['nullable', 'string', 'max:255'],

            // `sometimes` rather than `present`: omitting lines leaves them alone,
            // whereas sending an empty array would clear them.
            'lines' => ['sometimes', 'array', 'min:1'],
            'lines.*.product_id' => ['required', Rule::exists('products', 'id')],
            'lines.*.product_variant_id' => ['nullable', Rule::exists('product_variants', 'id'), $this->variantMatchesLineProduct()],
            'lines.*.unit_id' => ['nullable', Rule::exists('units', 'id')],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'lines.*.discount_amount' => ['nullable', 'numeric', 'min:0'],

            'lines.*.modifiers' => ['nullable', 'array'],
            'lines.*.modifiers.*' => [Rule::exists('modifier_options', 'id')],

            'lines.*.components' => ['nullable', 'array'],
            'lines.*.components.*.combo_slot_option_id' => ['required', Rule::exists('combo_slot_options', 'id')],
        ];
    }
}
