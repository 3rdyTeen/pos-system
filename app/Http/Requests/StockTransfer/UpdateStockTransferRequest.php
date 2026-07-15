<?php

namespace App\Http\Requests\StockTransfer;

use App\Http\Requests\Concerns\ValidatesStockLines;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStockTransferRequest extends FormRequest
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
            'from_warehouse_id' => ['required', Rule::exists('warehouses', 'id')],
            // Transferring stock to the warehouse it already sits in is a no-op.
            'to_warehouse_id' => ['required', Rule::exists('warehouses', 'id'), 'different:from_warehouse_id'],
            'transfer_number' => [
                'nullable', 'string', 'max:50',
                Rule::unique('stock_transfers', 'transfer_number')->ignore($this->route('stockTransfer')),
            ],
            'status' => ['required', Rule::in(['draft', 'in_transit', 'completed', 'cancelled'])],
            'requested_by' => ['nullable', Rule::exists('users', 'id')],
            'approved_by' => ['nullable', Rule::exists('users', 'id')],
            'transfer_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],

            // Omit `details` entirely to leave the existing lines alone.
            'details' => ['sometimes', 'array'],
            'details.*.product_id' => ['required', Rule::exists('products', 'id')],
            'details.*.product_variant_id' => ['nullable', Rule::exists('product_variants', 'id'), $this->variantMatchesLineProduct()],
            'details.*.quantity' => ['required', 'numeric', 'gt:0'],
            'details.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ];
    }
}
