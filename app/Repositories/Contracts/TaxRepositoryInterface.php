<?php

namespace App\Repositories\Contracts;

use App\Models\Tax;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TaxRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Tax>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Tax;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Tax;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Tax $tax, array $data): Tax;

    public function delete(Tax $tax): void;
}
