<?php

namespace App\Repositories\Contracts;

use App\Models\PurchaseReturn;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PurchaseReturnRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PurchaseReturn>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?PurchaseReturn;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PurchaseReturn;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PurchaseReturn $return, array $data): PurchaseReturn;

    public function delete(PurchaseReturn $return): void;

    /**
     * Replace the return's lines with the given set.
     *
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(PurchaseReturn $return, array $details): void;

    /**
     * The highest document number issued under the given prefix.
     */
    public function latestNumber(string $prefix): ?string;
}
