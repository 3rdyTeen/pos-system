<?php

namespace App\Services;

use App\Models\Unit;
use App\Repositories\Contracts\UnitRepositoryInterface;

class UnitService
{
    public function __construct(private readonly UnitRepositoryInterface $units) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Unit
    {
        return $this->units->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Unit $unit, array $data): Unit
    {
        return $this->units->update($unit, $data);
    }

    public function delete(Unit $unit): void
    {
        $this->units->delete($unit);
    }
}
