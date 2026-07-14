<?php

namespace App\Http\Requests\Tax;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaxRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100'],
            'rate' => ['required', 'numeric', 'min:0'],
            'type' => ['required', Rule::in(['sales', 'purchase', 'both'])],
            'is_inclusive' => ['boolean'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
