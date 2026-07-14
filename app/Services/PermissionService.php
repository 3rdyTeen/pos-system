<?php

namespace App\Services;

use App\Models\Permission;
use App\Repositories\Contracts\PermissionRepositoryInterface;

class PermissionService
{
    public function __construct(private readonly PermissionRepositoryInterface $permissions) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Permission
    {
        return $this->permissions->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Permission $permission, array $data): Permission
    {
        return $this->permissions->update($permission, $data);
    }

    public function toggle(Permission $permission): Permission
    {
        return $this->permissions->update($permission, ['is_enabled' => ! $permission->is_enabled]);
    }

    public function delete(Permission $permission): void
    {
        $this->permissions->delete($permission);
    }
}
