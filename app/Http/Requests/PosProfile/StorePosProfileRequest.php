<?php

namespace App\Http\Requests\PosProfile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePosProfileRequest extends FormRequest
{
    /**
     * Order types a profile may allow. `retail` covers a plain counter; the rest
     * cover table service and delivery.
     *
     * @var list<string>
     */
    public const ORDER_TYPES = ['retail', 'dine_in', 'takeout', 'delivery'];

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'company_id' => ['required', Rule::exists('companies', 'id')],
            'name' => ['required', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:30', Rule::unique('pos_profiles', 'code')],
            'picking_mode' => ['required', Rule::in(['barcode', 'tiles', 'hybrid'])],
            'order_types' => ['required', 'array', 'min:1'],
            'order_types.*' => [Rule::in(self::ORDER_TYPES)],
            'default_order_type' => ['nullable', Rule::in(self::ORDER_TYPES), 'in_array:order_types.*'],
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
