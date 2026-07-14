<?php

namespace App\Repositories\Contracts;

use App\Models\Permission;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PermissionRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Permission>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Permission;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Permission;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Permission $permission, array $data): Permission;

    public function delete(Permission $permission): void;

    /**
     * @return Collection<int, Permission>
     */
    public function enabled(): Collection;
}
