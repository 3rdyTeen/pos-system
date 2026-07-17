<?php

namespace App\Http\Requests\ModifierGroup;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateModifierGroupRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'selection_type' => ['required', Rule::in(['single', 'multiple'])],
            'is_required' => ['boolean'],
            'min_select' => ['integer', 'min:0', 'max:255'],
            'max_select' => ['nullable', 'integer', 'min:1', 'max:255', 'gte:min_select'],
            'sort_order' => ['integer', 'min:0'],
            'status' => ['required', Rule::in(['active', 'inactive'])],

            // `sometimes`: omitting options leaves them alone.
            'options' => ['sometimes', 'array', 'min:1'],
            'options.*.id' => ['nullable', Rule::exists('modifier_options', 'id')],
            'options.*.name' => ['required', 'string', 'max:100'],
            'options.*.price_delta' => ['required', 'numeric'],
            'options.*.product_id' => ['nullable', Rule::exists('products', 'id')],
            'options.*.is_default' => ['boolean'],

            'product_ids' => ['sometimes', 'array'],
            'product_ids.*' => [Rule::exists('products', 'id')],
        ];
    }
}
