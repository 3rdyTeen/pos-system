<?php

namespace App\Services;

use App\Models\ProductUnit;
use App\Repositories\Contracts\ProductUnitRepositoryInterface;

class ProductUnitService
{
    public function __construct(private readonly ProductUnitRepositoryInterface $productUnits) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductUnit
    {
        $productUnit = $this->productUnits->create($data);

        $this->enforceSingleBaseUnit($productUnit);

        return $productUnit;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductUnit $productUnit, array $data): ProductUnit
    {
        $productUnit = $this->productUnits->update($productUnit, $data);

        $this->enforceSingleBaseUnit($productUnit);

        return $productUnit;
    }

    public function delete(ProductUnit $productUnit): void
    {
        $this->productUnits->delete($productUnit);
    }

    /**
     * A product may only have one base unit; clear the flag from the others.
     */
    private function enforceSingleBaseUnit(ProductUnit $productUnit): void
    {
        if ($productUnit->is_base_unit) {
            $this->productUnits->unsetBaseUnitForProduct($productUnit->product_id, $productUnit->id);
        }
    }
}
