<?php

namespace App\Http\Requests\Role;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveRolePermissionsRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'modules' => ['present', 'array'],
            'modules.*.module_id' => ['required', 'uuid', 'exists:modules,id'],
            'modules.*.enabled' => ['boolean'],
            'modules.*.permission_ids' => ['array'],
            'modules.*.permission_ids.*' => ['uuid', 'exists:permissions,id'],
        ];
    }
}
