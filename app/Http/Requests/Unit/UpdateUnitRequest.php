<?php

namespace App\Http\Requests\Unit;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnitRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:50'],
            'abbreviation' => ['required', 'string', 'max:10'],
            'base_unit_id' => ['nullable', Rule::exists('units', 'id'), Rule::notIn([$this->route('unit')])],
            'conversion_factor' => ['required', 'numeric', 'min:0'],
        ];
    }
}
