<?php

namespace App\Repositories\Contracts;

use App\Models\PurchaseOrder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PurchaseOrderRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PurchaseOrder>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?PurchaseOrder;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PurchaseOrder;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PurchaseOrder $order, array $data): PurchaseOrder;

    public function delete(PurchaseOrder $order): void;

    /**
     * Replace the order's lines with the given set.
     *
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(PurchaseOrder $order, array $details): void;

    /**
     * Total already paid against the order.
     */
    public function paidTotal(PurchaseOrder $order): string;

    public function returnsCount(PurchaseOrder $order): int;

    /**
     * The highest document number issued under the given prefix.
     */
    public function latestNumber(string $prefix): ?string;

    /**
     * Orders for selection inputs (the return form's PO dropdown).
     *
     * @return Collection<int, PurchaseOrder>
     */
    public function options(?string $supplierId = null): Collection;
}
