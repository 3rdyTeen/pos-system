<?php

namespace App\Http\Requests\PosProfile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePosProfileRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'code' => [
                'nullable', 'string', 'max:30',
                Rule::unique('pos_profiles', 'code')->ignore($this->route('posProfile')),
            ],
            'picking_mode' => ['required', Rule::in(['barcode', 'tiles', 'hybrid'])],
            'order_types' => ['required', 'array', 'min:1'],
            'order_types.*' => [Rule::in(StorePosProfileRequest::ORDER_TYPES)],
            'default_order_type' => ['nullable', Rule::in(StorePosProfileRequest::ORDER_TYPES), 'in_array:order_types.*'],
            'quick_tender' => ['nullable', 'array'],
            'quick_tender.*' => ['numeric', 'gt:0'],
            'require_customer' => ['boolean'],
            'allow_held_orders' => ['boolean'],
            'allow_negative_stock' => ['boolean'],
            'is_default' => ['boolean'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
