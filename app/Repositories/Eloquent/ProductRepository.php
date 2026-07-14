<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductRepository implements ProductRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'sku', 'selling_price', 'cost_price', 'created_at'];

    /**
     * Paginate products with search, company/category/status filters and sorting.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Product>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Product::query()
            ->with(['company:id,name', 'category:id,name', 'baseUnit:id,name', 'tax:id,name'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%");
                });
            })
            ->when($filters['company_id'] ?? null, fn ($query, string $companyId) => $query->where('company_id', $companyId))
            ->when($filters['category_id'] ?? null, fn ($query, string $categoryId) => $query->where('category_id', $categoryId))
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('is_active', $filters['status'] === 'active');
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?Product
    {
        return Product::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Product
    {
        return Product::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): Product
    {
        $product->update($data);

        return $product;
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
