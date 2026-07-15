<?php

namespace App\Repositories\Contracts;

use App\Models\StockTransfer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StockTransferRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, StockTransfer>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?StockTransfer;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): StockTransfer;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(StockTransfer $transfer, array $data): StockTransfer;

    public function delete(StockTransfer $transfer): void;

    /**
     * Replace the transfer's lines with the given set.
     *
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(StockTransfer $transfer, array $details): void;

    /**
     * The highest document number issued under the given prefix, used to derive the
     * next one. Scoped to the prefix so a hand-entered number in another format
     * cannot break the sequence.
     */
    public function latestNumber(string $prefix): ?string;
}
