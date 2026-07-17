<?php

namespace App\Repositories\Eloquent;

use App\Models\Warehouse;
use App\Repositories\Contracts\WarehouseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class WarehouseRepository implements WarehouseRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'code', 'status', 'created_at'];

    /**
     * Paginate warehouses with search, branch/company/status filters and sorting.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Warehouse>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Warehouse::query()
            ->with(['branch:id,name,company_id'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($filters['branch_id'] ?? null, fn ($query, string $branchId) => $query->where('branch_id', $branchId))
            // Warehouses reach a company through their branch.
            ->when(
                $filters['company_id'] ?? null,
                fn ($query, string $companyId) => $query->whereHas('branch', fn ($q) => $q->where('company_id', $companyId)),
            )
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?Warehouse
    {
        return Warehouse::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Warehouse
    {
        return Warehouse::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Warehouse $warehouse, array $data): Warehouse
    {
        $warehouse->update($data);

        return $warehouse;
    }

    public function delete(Warehouse $warehouse): void
    {
        $warehouse->delete();
    }

    public function unsetDefaultForBranch(string $branchId, ?string $exceptId = null): void
    {
        Warehouse::query()
            ->where('branch_id', $branchId)
            ->when($exceptId, fn ($query, string $id) => $query->where('id', '!=', $id))
            ->update(['is_default' => false]);
    }

    public function balancesCount(Warehouse $warehouse): int
    {
        return $warehouse->balances()->count();
    }

    public function defaultForBranch(string $branchId): ?string
    {
        return Warehouse::query()
            ->where('branch_id', $branchId)
            ->where('status', 'active')
            ->orderByDesc('is_default')
            ->value('id');
    }

    /**
     * Warehouses for selection inputs, optionally scoped to a branch.
     *
     * @return Collection<int, Warehouse>
     */
    public function options(?string $branchId = null): Collection
    {
        return Warehouse::query()
            ->when($branchId, fn ($query, string $id) => $query->where('branch_id', $id))
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'branch_id']);
    }
}
