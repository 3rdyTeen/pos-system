<?php

namespace App\Repositories\Contracts;

use App\Models\ModifierGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ModifierGroupRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, ModifierGroup>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ModifierGroup;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ModifierGroup $group, array $data): ModifierGroup;

    public function delete(ModifierGroup $group): void;

    /**
     * Replace the group's options with the given set.
     *
     * @param  list<array<string, mixed>>  $options
     */
    public function syncOptions(ModifierGroup $group, array $options): void;

    /**
     * Set exactly which products offer this group.
     *
     * @param  list<string>  $productIds
     */
    public function syncProducts(ModifierGroup $group, array $productIds): void;

    /**
     * Groups for selection inputs.
     *
     * @return Collection<int, ModifierGroup>
     */
    public function options(): Collection;
}
