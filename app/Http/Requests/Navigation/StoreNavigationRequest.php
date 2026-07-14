<?php

namespace App\Http\Requests\Navigation;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNavigationRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->filled('url')) {
            $this->merge(['url' => '/'.ltrim((string) $this->input('url'), '/')]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'module_id' => [
                'required',
                Rule::exists('modules', 'id')->where('is_enabled', true)->whereNull('deleted_at'),
            ],
            'parent_id' => [
                'nullable',
                Rule::exists('navigations', 'id')->whereNull('deleted_at'),
            ],
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9_.-]+$/',
                Rule::unique('navigations', 'code')->whereNull('deleted_at'),
            ],
            'icon' => ['nullable', 'string', 'max:255'],
            'url' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
