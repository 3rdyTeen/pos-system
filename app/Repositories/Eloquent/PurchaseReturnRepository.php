<?php

namespace App\Repositories\Eloquent;

use App\Models\PurchaseReturn;
use App\Repositories\Contracts\PurchaseReturnRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PurchaseReturnRepository implements PurchaseReturnRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['return_number', 'return_date', 'total_amount', 'status', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PurchaseReturn>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return PurchaseReturn::query()
            ->with(['purchaseOrder:id,po_number,supplier_id', 'purchaseOrder.supplier:id,name', 'branch:id,name', 'user:id,name'])
            ->withCount('details')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('return_number', 'like', "%{$search}%")
                        ->orWhere('reason', 'like', "%{$search}%")
                        ->orWhereHas('purchaseOrder', fn ($o) => $o->where('po_number', 'like', "%{$search}%"));
                });
            })
            ->when($filters['purchase_order_id'] ?? null, fn ($query, string $id) => $query->where('purchase_order_id', $id))
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?PurchaseReturn
    {
        return PurchaseReturn::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PurchaseReturn
    {
        return PurchaseReturn::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PurchaseReturn $return, array $data): PurchaseReturn
    {
        $return->update($data);

        return $return;
    }

    public function delete(PurchaseReturn $return): void
    {
        // No cascade is configured, so clear the lines before the header.
        $return->details()->delete();
        $return->delete();
    }

    /**
     * Replace the return's lines with the given set.
     *
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(PurchaseReturn $return, array $details): void
    {
        $return->details()->delete();

        foreach ($details as $detail) {
            $return->details()->create($detail);
        }
    }

    public function latestNumber(string $prefix): ?string
    {
        return PurchaseReturn::query()
            ->where('return_number', 'like', $prefix.'%')
            ->max('return_number');
    }
}
