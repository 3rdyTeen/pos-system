<?php

namespace App\Http\Requests\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'company_id' => ['required', Rule::exists('companies', 'id')],
            'category_id' => ['nullable', Rule::exists('product_categories', 'id')],
            'name' => ['required', 'string', 'max:150'],
            'sku' => ['nullable', 'string', 'max:50', Rule::unique('products', 'sku')->ignore($this->route('product'))],
            'description' => ['nullable', 'string'],
            'brand' => ['nullable', 'string', 'max:100'],
            'base_unit_id' => ['nullable', Rule::exists('units', 'id')],
            'tax_id' => ['nullable', Rule::exists('taxes', 'id')],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'reorder_level' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
