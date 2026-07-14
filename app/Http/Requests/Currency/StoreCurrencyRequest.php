<?php

namespace App\Http\Requests\Currency;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCurrencyRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:10', Rule::unique('currencies', 'code')],
            'name' => ['required', 'string', 'max:50'],
            'symbol' => ['nullable', 'string', 'max:10'],
            'exchange_rate' => ['required', 'numeric', 'min:0'],
            'is_base' => ['boolean'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
