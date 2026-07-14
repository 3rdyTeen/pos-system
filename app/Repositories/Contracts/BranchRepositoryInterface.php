<?php

namespace App\Repositories\Contracts;

use App\Models\Branch;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface BranchRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Branch>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Branch;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Branch;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Branch $branch, array $data): Branch;

    public function delete(Branch $branch): void;

    public function registersCount(Branch $branch): int;

    public function assignedUsersCount(Branch $branch): int;

    /**
     * Branches for selection inputs.
     *
     * @return Collection<int, Branch>
     */
    public function options(): Collection;
}
