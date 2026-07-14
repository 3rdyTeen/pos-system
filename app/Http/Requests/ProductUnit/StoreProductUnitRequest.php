<?php

namespace App\Http\Requests\ProductUnit;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductUnitRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'unit_id' => [
                'required',
                Rule::exists('units', 'id'),
                Rule::unique('product_units', 'unit_id')->where('product_id', $this->route('product')->id),
            ],
            'conversion_factor' => ['required', 'numeric', 'min:0'],
            'is_base_unit' => ['boolean'],
        ];
    }
}
