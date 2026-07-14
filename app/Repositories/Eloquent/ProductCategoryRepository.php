<?php

namespace App\Repositories\Eloquent;

use App\Models\ProductCategory;
use App\Repositories\Contracts\ProductCategoryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProductCategoryRepository implements ProductCategoryRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'status', 'created_at'];

    /**
     * Paginate categories with search, company/status filters and sorting.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, ProductCategory>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return ProductCategory::query()
            ->with(['company:id,name', 'parent:id,name'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($filters['company_id'] ?? null, fn ($query, string $companyId) => $query->where('company_id', $companyId))
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?ProductCategory
    {
        return ProductCategory::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductCategory
    {
        return ProductCategory::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductCategory $productCategory, array $data): ProductCategory
    {
        $productCategory->update($data);

        return $productCategory;
    }

    public function delete(ProductCategory $productCategory): void
    {
        $productCategory->delete();
    }

    public function productsCount(ProductCategory $productCategory): int
    {
        return $productCategory->products()->count();
    }

    /**
     * Categories for selection inputs (e.g. the parent/category dropdowns).
     *
     * @return Collection<int, ProductCategory>
     */
    public function options(?string $companyId = null): Collection
    {
        return ProductCategory::query()
            ->when($companyId, fn ($query, string $id) => $query->where('company_id', $id))
            ->orderBy('name')
            ->get(['id', 'name', 'company_id']);
    }
}
