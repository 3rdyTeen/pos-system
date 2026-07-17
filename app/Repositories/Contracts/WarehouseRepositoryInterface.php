<?php

namespace App\Repositories\Contracts;

use App\Models\Warehouse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface WarehouseRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Warehouse>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Warehouse;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Warehouse;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Warehouse $warehouse, array $data): Warehouse;

    public function delete(Warehouse $warehouse): void;

    /**
     * Clear the default flag on every other warehouse in the same branch.
     */
    public function unsetDefaultForBranch(string $branchId, ?string $exceptId = null): void;

    public function balancesCount(Warehouse $warehouse): int;

    /**
     * The warehouse a branch's stock moves through: its default, or its only active
     * one. Shared by the terminal (to show stock) and SaleService (to deduct it), so
     * that what the cashier sees and what gets taken are the same warehouse.
     */
    public function defaultForBranch(string $branchId): ?string;

    /**
     * Warehouses for selection inputs, optionally scoped to a branch.
     *
     * @return Collection<int, Warehouse>
     */
    public function options(?string $branchId = null): Collection;
}
