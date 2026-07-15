<?php

namespace App\Services;

use App\Models\Supplier;
use App\Repositories\Contracts\SupplierRepositoryInterface;

class SupplierService
{
    public function __construct(private readonly SupplierRepositoryInterface $suppliers) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Supplier
    {
        return $this->suppliers->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Supplier $supplier, array $data): Supplier
    {
        return $this->suppliers->update($supplier, $data);
    }

    public function delete(Supplier $supplier): void
    {
        $this->suppliers->delete($supplier);
    }
}
