<?php

namespace App\Services;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;

class ProductService
{
    public function __construct(private readonly ProductRepositoryInterface $products) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Product
    {
        return $this->products->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): Product
    {
        return $this->products->update($product, $data);
    }

    public function delete(Product $product): void
    {
        $this->products->delete($product);
    }
}
