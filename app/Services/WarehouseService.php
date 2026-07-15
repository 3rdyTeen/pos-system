<?php

namespace App\Services;

use App\Models\Warehouse;
use App\Repositories\Contracts\WarehouseRepositoryInterface;
use Illuminate\Validation\ValidationException;

class WarehouseService
{
    public function __construct(private readonly WarehouseRepositoryInterface $warehouses) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Warehouse
    {
        $warehouse = $this->warehouses->create($data);

        $this->enforceSingleDefault($warehouse);

        return $warehouse;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Warehouse $warehouse, array $data): Warehouse
    {
        $warehouse = $this->warehouses->update($warehouse, $data);

        $this->enforceSingleDefault($warehouse);

        return $warehouse;
    }

    /**
     * Delete a warehouse, refusing when stock is still held there.
     *
     * @throws ValidationException
     */
    public function delete(Warehouse $warehouse): void
    {
        $balances = $this->warehouses->balancesCount($warehouse);

        if ($balances > 0) {
            throw ValidationException::withMessages([
                'warehouse' => "This warehouse cannot be deleted because it holds {$balances} stock balance(s).",
            ]);
        }

        $this->warehouses->delete($warehouse);
    }

    /**
     * A branch has at most one default warehouse, so flagging one clears the rest.
     */
    private function enforceSingleDefault(Warehouse $warehouse): void
    {
        if ($warehouse->is_default) {
            $this->warehouses->unsetDefaultForBranch($warehouse->branch_id, $warehouse->id);
        }
    }
}
