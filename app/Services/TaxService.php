<?php

namespace App\Services;

use App\Models\Tax;
use App\Repositories\Contracts\TaxRepositoryInterface;

class TaxService
{
    public function __construct(private readonly TaxRepositoryInterface $taxes) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Tax
    {
        return $this->taxes->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Tax $tax, array $data): Tax
    {
        return $this->taxes->update($tax, $data);
    }

    public function delete(Tax $tax): void
    {
        $this->taxes->delete($tax);
    }
}
