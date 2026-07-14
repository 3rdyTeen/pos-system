<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Repositories\Contracts\ProductVariantRepositoryInterface;

class ProductVariantService
{
    public function __construct(private readonly ProductVariantRepositoryInterface $variants) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductVariant
    {
        return $this->variants->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductVariant $variant, array $data): ProductVariant
    {
        return $this->variants->update($variant, $data);
    }

    public function delete(ProductVariant $variant): void
    {
        $this->variants->delete($variant);
    }
}
