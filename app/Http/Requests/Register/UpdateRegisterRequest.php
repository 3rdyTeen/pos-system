<?php

namespace App\Http\Requests\Register;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRegisterRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:30', Rule::unique('registers', 'code')->ignore($this->route('register'))],
            'ip_address' => ['nullable', 'ip'],
            'status' => ['required', Rule::in(['open', 'closed', 'maintenance'])],
        ];
    }
}
