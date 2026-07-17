<?php

namespace App\Repositories\Contracts;

use App\Models\Sale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface SaleRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Sale>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Sale;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Sale;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Sale $sale, array $data): Sale;

    public function delete(Sale $sale): void;

    /**
     * Replace the sale's lines, each with the choices made against it.
     *
     * @param  list<array{detail: array<string, mixed>, modifiers: list<array<string, mixed>>, components: list<array<string, mixed>>}>  $details
     */
    public function syncDetails(Sale $sale, array $details): void;

    /**
     * Replace the sale's tax breakdown with the given set.
     *
     * @param  list<array<string, mixed>>  $taxes
     */
    public function syncTaxes(Sale $sale, array $taxes): void;

    /**
     * Add the given tenders to the sale.
     *
     * @param  list<array<string, mixed>>  $payments
     */
    public function syncPayments(Sale $sale, array $payments, ?string $userId = null): void;

    public function returnsCount(Sale $sale): int;

    public function latestNumber(string $prefix): ?string;

    /**
     * Carts parked on a register, for the terminal's resume list.
     *
     * @return Collection<int, Sale>
     */
    public function held(?string $registerId = null): Collection;

    /**
     * Completed sales for selection inputs (the return form's sale dropdown).
     *
     * @return Collection<int, Sale>
     */
    public function options(?string $customerId = null): Collection;
}
