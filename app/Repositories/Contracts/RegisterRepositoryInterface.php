<?php

namespace App\Repositories\Contracts;

use App\Models\Register;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RegisterRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Register>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Register;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Register;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Register $register, array $data): Register;

    public function delete(Register $register): void;
}
