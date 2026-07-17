<?php

namespace App\Repositories\Eloquent;

use App\Models\Sale;
use App\Models\SalesReturn;
use App\Models\SalesReturnDetail;
use App\Repositories\Contracts\SalesReturnRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SalesReturnRepository implements SalesReturnRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['return_number', 'return_date', 'total_amount', 'status', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, SalesReturn>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return SalesReturn::query()
            ->with(['sale:id,sale_number,customer_id', 'sale.customer:id,name', 'branch:id,name', 'user:id,name'])
            ->withCount('details')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('return_number', 'like', "%{$search}%")
                        ->orWhere('reason', 'like', "%{$search}%")
                        ->orWhereHas('sale', fn ($s) => $s->where('sale_number', 'like', "%{$search}%"));
                });
            })
            ->when($filters['sale_id'] ?? null, fn ($query, string $id) => $query->where('sale_id', $id))
            ->when($filters['branch_id'] ?? null, fn ($query, string $id) => $query->where('branch_id', $id))
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?SalesReturn
    {
        return SalesReturn::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): SalesReturn
    {
        return SalesReturn::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(SalesReturn $return, array $data): SalesReturn
    {
        $return->update($data);

        return $return;
    }

    public function delete(SalesReturn $return): void
    {
        // No cascade is configured, so clear the children before the header.
        $return->details()->delete();
        $return->delete();
    }

    /**
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(SalesReturn $return, array $details): void
    {
        $return->details()->delete();

        foreach ($details as $detail) {
            $return->details()->create($detail);
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function detailRows(SalesReturn $return): array
    {
        return $return->details()->get()->map(fn (SalesReturnDetail $detail) => [
            'sales_detail_id' => $detail->sales_detail_id,
            'product_id' => $detail->product_id,
            'product_variant_id' => $detail->product_variant_id,
            'quantity' => (float) $detail->quantity,
            'unit_price' => (float) $detail->unit_price,
            'line_total' => (float) $detail->line_total,
        ])->all();
    }

    /**
     * @return array<string, float>
     */
    public function returnedQuantities(Sale $sale, ?SalesReturn $excluding = null): array
    {
        return SalesReturnDetail::query()
            ->whereHas('salesReturn', function ($query) use ($sale, $excluding) {
                $query->where('sale_id', $sale->id)
                    ->where('status', 'completed')
                    ->when($excluding, fn ($q, SalesReturn $return) => $q->whereKeyNot($return->id));
            })
            ->selectRaw('sales_detail_id, SUM(quantity) as returned')
            ->groupBy('sales_detail_id')
            ->pluck('returned', 'sales_detail_id')
            ->map(fn ($quantity) => (float) $quantity)
            ->all();
    }

    public function latestNumber(string $prefix): ?string
    {
        return SalesReturn::query()
            ->where('return_number', 'like', $prefix.'%')
            ->max('return_number');
    }
}
