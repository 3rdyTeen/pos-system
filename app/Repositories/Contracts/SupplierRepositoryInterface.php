<?php

namespace App\Repositories\Contracts;

use App\Models\Supplier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface SupplierRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Supplier>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Supplier;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Supplier;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Supplier $supplier, array $data): Supplier;

    public function delete(Supplier $supplier): void;

    /**
     * Suppliers for selection inputs.
     *
     * @return Collection<int, Supplier>
     */
    public function options(?string $companyId = null): Collection;
}
