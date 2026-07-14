<?php

namespace App\Services;

use App\Models\ProductCategory;
use App\Repositories\Contracts\ProductCategoryRepositoryInterface;
use Illuminate\Validation\ValidationException;

class ProductCategoryService
{
    public function __construct(private readonly ProductCategoryRepositoryInterface $categories) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductCategory
    {
        return $this->categories->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductCategory $productCategory, array $data): ProductCategory
    {
        return $this->categories->update($productCategory, $data);
    }

    /**
     * Delete a category, refusing when products still reference it.
     *
     * @throws ValidationException
     */
    public function delete(ProductCategory $productCategory): void
    {
        $products = $this->categories->productsCount($productCategory);

        if ($products > 0) {
            throw ValidationException::withMessages([
                'category' => "This category cannot be deleted because it has {$products} product(s).",
            ]);
        }

        $this->categories->delete($productCategory);
    }
}
