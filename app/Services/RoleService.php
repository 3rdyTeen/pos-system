<?php

namespace App\Services;

use App\Models\Role;
use App\Repositories\Contracts\RoleRepositoryInterface;
use Illuminate\Validation\ValidationException;

class RoleService
{
    public function __construct(private readonly RoleRepositoryInterface $roles) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Role
    {
        return $this->roles->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Role $role, array $data): Role
    {
        return $this->roles->update($role, $data);
    }

    public function toggle(Role $role): Role
    {
        return $this->roles->update($role, ['is_enabled' => ! $role->is_enabled]);
    }

    /**
     * Soft delete a role, refusing when users are still assigned to it.
     *
     * @throws ValidationException
     */
    public function delete(Role $role): void
    {
        $assigned = $this->roles->assignedUsersCount($role);

        if ($assigned > 0) {
            throw ValidationException::withMessages([
                'role' => "This role cannot be deleted because it is assigned to {$assigned} user(s).",
            ]);
        }

        $this->roles->delete($role);
    }
}
