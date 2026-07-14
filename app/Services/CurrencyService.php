<?php

namespace App\Services;

use App\Models\Currency;
use App\Repositories\Contracts\CurrencyRepositoryInterface;

class CurrencyService
{
    public function __construct(private readonly CurrencyRepositoryInterface $currencies) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Currency
    {
        return $this->currencies->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Currency $currency, array $data): Currency
    {
        return $this->currencies->update($currency, $data);
    }

    public function delete(Currency $currency): void
    {
        $this->currencies->delete($currency);
    }
}
