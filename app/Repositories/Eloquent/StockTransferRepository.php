<?php

namespace App\Repositories\Eloquent;

use App\Models\StockTransfer;
use App\Repositories\Contracts\StockTransferRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockTransferRepository implements StockTransferRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['transfer_number', 'status', 'transfer_date', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, StockTransfer>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return StockTransfer::query()
            ->with(['fromWarehouse:id,name', 'toWarehouse:id,name', 'requestedBy:id,name'])
            ->withCount('details')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('transfer_number', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%");
                });
            })
            ->when(
                $filters['warehouse_id'] ?? null,
                // Match either side of the move.
                fn ($query, string $warehouseId) => $query->where(function ($q) use ($warehouseId) {
                    $q->where('from_warehouse_id', $warehouseId)->orWhere('to_warehouse_id', $warehouseId);
                }),
            )
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?StockTransfer
    {
        return StockTransfer::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): StockTransfer
    {
        return StockTransfer::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(StockTransfer $transfer, array $data): StockTransfer
    {
        $transfer->update($data);

        return $transfer;
    }

    public function delete(StockTransfer $transfer): void
    {
        // Lines have no cascade configured, so clear them before the header.
        $transfer->details()->delete();
        $transfer->delete();
    }

    /**
     * Replace the transfer's lines with the given set.
     *
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(StockTransfer $transfer, array $details): void
    {
        $transfer->details()->delete();

        foreach ($details as $detail) {
            $transfer->details()->create($detail);
        }
    }

    public function latestNumber(string $prefix): ?string
    {
        return StockTransfer::query()
            ->where('transfer_number', 'like', $prefix.'%')
            ->max('transfer_number');
    }
}
