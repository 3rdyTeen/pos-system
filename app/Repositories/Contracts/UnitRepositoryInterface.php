<?php

namespace App\Repositories\Contracts;

use App\Models\Unit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface UnitRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Unit>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Unit;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Unit;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Unit $unit, array $data): Unit;

    public function delete(Unit $unit): void;

    /**
     * Units for selection inputs (e.g. the base-unit dropdown).
     *
     * @return Collection<int, Unit>
     */
    public function options(?string $companyId = null): Collection;
}
