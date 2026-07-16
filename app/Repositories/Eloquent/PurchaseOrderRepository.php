<?php

namespace App\Repositories\Eloquent;

use App\Models\PurchaseOrder;
use App\Repositories\Contracts\PurchaseOrderRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PurchaseOrderRepository implements PurchaseOrderRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['po_number', 'order_date', 'expected_date', 'grand_total', 'status', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PurchaseOrder>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return PurchaseOrder::query()
            ->with(['supplier:id,name', 'warehouse:id,name', 'branch:id,name'])
            ->withCount('details')
            ->withSum('payments as paid_total', 'amount')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('po_number', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['supplier_id'] ?? null, fn ($query, string $id) => $query->where('supplier_id', $id))
            ->when($filters['warehouse_id'] ?? null, fn ($query, string $id) => $query->where('warehouse_id', $id))
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?PurchaseOrder
    {
        return PurchaseOrder::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PurchaseOrder
    {
        return PurchaseOrder::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PurchaseOrder $order, array $data): PurchaseOrder
    {
        $order->update($data);

        return $order;
    }

    public function delete(PurchaseOrder $order): void
    {
        // No cascade is configured, so clear the children before the header.
        $order->details()->delete();
        $order->payments()->delete();
        $order->delete();
    }

    /**
     * Replace the order's lines with the given set.
     *
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(PurchaseOrder $order, array $details): void
    {
        $order->details()->delete();

        foreach ($details as $detail) {
            $order->details()->create($detail);
        }
    }

    public function paidTotal(PurchaseOrder $order): string
    {
        return (string) ($order->payments()->sum('amount') ?? 0);
    }

    public function returnsCount(PurchaseOrder $order): int
    {
        return $order->returns()->count();
    }

    public function latestNumber(string $prefix): ?string
    {
        return PurchaseOrder::query()
            ->where('po_number', 'like', $prefix.'%')
            ->max('po_number');
    }

    /**
     * Orders for selection inputs (the return form's PO dropdown).
     *
     * @return Collection<int, PurchaseOrder>
     */
    public function options(?string $supplierId = null): Collection
    {
        return PurchaseOrder::query()
            ->when($supplierId, fn ($query, string $id) => $query->where('supplier_id', $id))
            ->orderByDesc('created_at')
            ->get(['id', 'po_number', 'supplier_id', 'branch_id']);
    }
}
