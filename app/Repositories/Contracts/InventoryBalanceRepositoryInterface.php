<?php

namespace App\Repositories\Contracts;

use App\Models\InventoryBalance;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Balances are derived state maintained by stock postings, so this contract is
 * read-only by design.
 */
interface InventoryBalanceRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, InventoryBalance>
     */
    public function paginate(array $filters): LengthAwarePaginator;
}
