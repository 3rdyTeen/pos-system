<?php

namespace App\Http\Requests\Warehouse;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWarehouseRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', Rule::exists('branches', 'id')],
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:30', Rule::unique('warehouses', 'code')],
            'address' => ['nullable', 'string', 'max:255'],
            'is_default' => ['boolean'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
