<?php

namespace App\Repositories\Contracts;

use App\Models\Role;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface RoleRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Role>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Role;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Role;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Role $role, array $data): Role;

    public function delete(Role $role): void;

    public function assignedUsersCount(Role $role): int;

    /**
     * @return Collection<int, Role>
     */
    public function enabled(): Collection;
}
