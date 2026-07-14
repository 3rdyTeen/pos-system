<?php

namespace App\Http\Requests\ProductBarcode;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductBarcodeRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $productId = $this->route('product')->id;

        return [
            'barcode' => ['required', 'string', 'max:100', Rule::unique('product_barcodes', 'barcode')],
            'product_variant_id' => ['nullable', Rule::exists('product_variants', 'id')->where('product_id', $productId)],
            'product_unit_id' => ['nullable', Rule::exists('product_units', 'id')->where('product_id', $productId)],
            'is_primary' => ['boolean'],
        ];
    }
}
