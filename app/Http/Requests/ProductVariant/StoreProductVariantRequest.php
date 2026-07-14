<?php

namespace App\Http\Requests\ProductVariant;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductVariantRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'variant_name' => ['required', 'string', 'max:150'],
            'sku' => ['nullable', 'string', 'max:50', Rule::unique('product_variants', 'sku')],
            'attributes' => ['nullable', 'array'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
