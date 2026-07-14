<?php

namespace App\Repositories\Contracts;

use App\Models\ProductCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ProductCategoryRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, ProductCategory>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?ProductCategory;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductCategory;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductCategory $productCategory, array $data): ProductCategory;

    public function delete(ProductCategory $productCategory): void;

    public function productsCount(ProductCategory $productCategory): int;

    /**
     * Categories for selection inputs (e.g. the parent/category dropdowns).
     *
     * @return Collection<int, ProductCategory>
     */
    public function options(?string $companyId = null): Collection;
}
