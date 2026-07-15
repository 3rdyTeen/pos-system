<?php

namespace App\Repositories\Contracts;

use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface CustomerRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Customer>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Customer;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Customer;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Customer $customer, array $data): Customer;

    public function delete(Customer $customer): void;

    /**
     * Customers for selection inputs.
     *
     * @return Collection<int, Customer>
     */
    public function options(?string $companyId = null): Collection;
}
