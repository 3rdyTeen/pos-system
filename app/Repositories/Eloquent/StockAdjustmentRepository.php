<?php

namespace App\Repositories\Eloquent;

use App\Models\StockAdjustment;
use App\Repositories\Contracts\StockAdjustmentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockAdjustmentRepository implements StockAdjustmentRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['adjustment_number', 'status', 'adjustment_date', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, StockAdjustment>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return StockAdjustment::query()
            ->with(['warehouse:id,name', 'adjustedBy:id,name'])
            ->withCount('details')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('adjustment_number', 'like', "%{$search}%")
                        ->orWhere('reason', 'like', "%{$search}%");
                });
            })
            ->when($filters['warehouse_id'] ?? null, fn ($query, string $warehouseId) => $query->where('warehouse_id', $warehouseId))
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?StockAdjustment
    {
        return StockAdjustment::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): StockAdjustment
    {
        return StockAdjustment::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(StockAdjustment $adjustment, array $data): StockAdjustment
    {
        $adjustment->update($data);

        return $adjustment;
    }

    public function delete(StockAdjustment $adjustment): void
    {
        // Lines have no cascade configured, so clear them before the header.
        $adjustment->details()->delete();
        $adjustment->delete();
    }

    /**
     * Replace the adjustment's lines with the given set.
     *
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(StockAdjustment $adjustment, array $details): void
    {
        $adjustment->details()->delete();

        foreach ($details as $detail) {
            $adjustment->details()->create($detail);
        }
    }

    public function latestNumber(string $prefix): ?string
    {
        return StockAdjustment::query()
            ->where('adjustment_number', 'like', $prefix.'%')
            ->max('adjustment_number');
    }
}
