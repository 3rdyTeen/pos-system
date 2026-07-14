<?php

namespace App\Repositories\Contracts;

use App\Models\Module;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ModuleRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Module>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Module;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Module;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Module $module, array $data): Module;

    public function delete(Module $module): void;

    /**
     * @return Collection<int, Module>
     */
    public function enabled(): Collection;
}
