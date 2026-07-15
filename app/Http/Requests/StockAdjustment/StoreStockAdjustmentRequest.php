<?php

namespace App\Http\Requests\StockAdjustment;

use App\Http\Requests\Concerns\ValidatesStockLines;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockAdjustmentRequest extends FormRequest
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
            'warehouse_id' => ['required', Rule::exists('warehouses', 'id')],
            // Left out to let the service issue the next ADJ- number.
            'adjustment_number' => ['nullable', 'string', 'max:50', Rule::unique('stock_adjustments', 'adjustment_number')],
            'reason' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['draft', 'approved', 'cancelled'])],
            'adjusted_by' => ['nullable', Rule::exists('users', 'id')],
            'adjustment_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],

            'details' => ['present', 'array'],
            'details.*.product_id' => ['required', Rule::exists('products', 'id')],
            'details.*.product_variant_id' => ['nullable', Rule::exists('product_variants', 'id'), $this->variantMatchesLineProduct()],
            'details.*.system_qty' => ['required', 'numeric'],
            'details.*.counted_qty' => ['required', 'numeric'],
            'details.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ];
    }
}
