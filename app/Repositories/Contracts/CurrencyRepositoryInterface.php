<?php

namespace App\Repositories\Contracts;

use App\Models\Currency;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CurrencyRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Currency>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Currency;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Currency;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Currency $currency, array $data): Currency;

    public function delete(Currency $currency): void;
}
