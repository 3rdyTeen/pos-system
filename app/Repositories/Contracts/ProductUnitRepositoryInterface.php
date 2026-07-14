<?php

namespace App\Repositories\Contracts;

use App\Models\ProductUnit;
use Illuminate\Database\Eloquent\Collection;

interface ProductUnitRepositoryInterface
{
    /**
     * All units for a product.
     *
     * @return Collection<int, ProductUnit>
     */
    public function forProduct(string $productId): Collection;

    public function findById(string $id): ?ProductUnit;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductUnit;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductUnit $productUnit, array $data): ProductUnit;

    public function delete(ProductUnit $productUnit): void;

    /**
     * Clear the base-unit flag from every unit of a product, optionally excepting one.
     */
    public function unsetBaseUnitForProduct(string $productId, ?string $exceptId = null): void;
}
