<?php

namespace App\Repositories\Contracts;

use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;

interface ProductVariantRepositoryInterface
{
    /**
     * All variants for a product.
     *
     * @return Collection<int, ProductVariant>
     */
    public function forProduct(string $productId): Collection;

    public function findById(string $id): ?ProductVariant;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductVariant;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductVariant $variant, array $data): ProductVariant;

    public function delete(ProductVariant $variant): void;
}
