<?php

namespace App\Repositories\Eloquent;

use App\Models\ProductVariant;
use App\Repositories\Contracts\ProductVariantRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ProductVariantRepository implements ProductVariantRepositoryInterface
{
    /**
     * All variants for a product.
     *
     * @return Collection<int, ProductVariant>
     */
    public function forProduct(string $productId): Collection
    {
        return ProductVariant::query()
            ->where('product_id', $productId)
            ->orderBy('variant_name')
            ->get();
    }

    public function findById(string $id): ?ProductVariant
    {
        return ProductVariant::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductVariant
    {
        return ProductVariant::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductVariant $variant, array $data): ProductVariant
    {
        $variant->update($data);

        return $variant;
    }

    public function delete(ProductVariant $variant): void
    {
        $variant->delete();
    }
}
