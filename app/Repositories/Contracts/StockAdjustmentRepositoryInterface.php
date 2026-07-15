<?php

namespace App\Repositories\Contracts;

use App\Models\StockAdjustment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StockAdjustmentRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, StockAdjustment>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?StockAdjustment;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): StockAdjustment;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(StockAdjustment $adjustment, array $data): StockAdjustment;

    public function delete(StockAdjustment $adjustment): void;

    /**
     * Replace the adjustment's lines with the given set.
     *
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(StockAdjustment $adjustment, array $details): void;

    /**
     * The highest document number issued under the given prefix, used to derive the
     * next one. Scoped to the prefix so a hand-entered number in another format
     * cannot break the sequence.
     */
    public function latestNumber(string $prefix): ?string;
}
