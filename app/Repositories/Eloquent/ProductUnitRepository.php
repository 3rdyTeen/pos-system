<?php

namespace App\Repositories\Eloquent;

use App\Models\ProductUnit;
use App\Repositories\Contracts\ProductUnitRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ProductUnitRepository implements ProductUnitRepositoryInterface
{
    /**
     * All units for a product.
     *
     * @return Collection<int, ProductUnit>
     */
    public function forProduct(string $productId): Collection
    {
        return ProductUnit::query()
            ->with('unit:id,name,abbreviation')
            ->where('product_id', $productId)
            ->get();
    }

    public function findById(string $id): ?ProductUnit
    {
        return ProductUnit::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductUnit
    {
        return ProductUnit::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductUnit $productUnit, array $data): ProductUnit
    {
        $productUnit->update($data);

        return $productUnit;
    }

    public function delete(ProductUnit $productUnit): void
    {
        $productUnit->delete();
    }

    public function unsetBaseUnitForProduct(string $productId, ?string $exceptId = null): void
    {
        ProductUnit::query()
            ->where('product_id', $productId)
            ->when($exceptId, fn ($query, string $id) => $query->where('id', '!=', $id))
            ->update(['is_base_unit' => false]);
    }
}
