<?php

namespace App\Repositories\Eloquent;

use App\Models\InventoryBalance;
use App\Repositories\Contracts\InventoryBalanceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InventoryBalanceRepository implements InventoryBalanceRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['quantity_on_hand', 'quantity_reserved', 'quantity_available', 'average_cost', 'updated_at'];

    /**
     * Paginate balances with product search and warehouse/stock-level filters.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, InventoryBalance>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'updated_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return InventoryBalance::query()
            ->with(['warehouse:id,name', 'product:id,name,sku,reorder_level', 'variant:id,variant_name'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($filters['warehouse_id'] ?? null, fn ($query, string $warehouseId) => $query->where('warehouse_id', $warehouseId))
            ->when($filters['product_id'] ?? null, fn ($query, string $productId) => $query->where('product_id', $productId))
            // "In stock" / "out of stock" are read off the generated available column.
            ->when(($filters['stock'] ?? 'all') === 'in_stock', fn ($query) => $query->where('quantity_available', '>', 0))
            ->when(($filters['stock'] ?? 'all') === 'out_of_stock', fn ($query) => $query->where('quantity_available', '<=', 0))
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }
}
