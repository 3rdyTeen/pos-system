<?php

namespace App\Repositories\Eloquent;

use App\Models\Sale;
use App\Repositories\Contracts\SaleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SaleRepository implements SaleRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['sale_number', 'sale_date', 'grand_total', 'amount_due', 'status', 'payment_status', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Sale>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'sale_date';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Sale::query()
            ->with([
                'customer:id,name',
                'branch:id,name',
                'register:id,name',
                'user:id,name',
            ])
            ->withCount('details')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('sale_number', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['customer_id'] ?? null, fn ($query, string $id) => $query->where('customer_id', $id))
            ->when($filters['register_id'] ?? null, fn ($query, string $id) => $query->where('register_id', $id))
            ->when($filters['branch_id'] ?? null, fn ($query, string $id) => $query->where('branch_id', $id))
            ->when($filters['shift_id'] ?? null, fn ($query, string $id) => $query->where('shift_id', $id))
            ->when($filters['user_id'] ?? null, fn ($query, string $id) => $query->where('user_id', $id))
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->when(isset($filters['payment_status']) && $filters['payment_status'] !== 'all', function ($query) use ($filters) {
                $query->where('payment_status', $filters['payment_status']);
            })
            ->when($filters['from'] ?? null, fn ($query, string $from) => $query->whereDate('sale_date', '>=', $from))
            ->when($filters['to'] ?? null, fn ($query, string $to) => $query->whereDate('sale_date', '<=', $to))
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?Sale
    {
        return Sale::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Sale
    {
        return Sale::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Sale $sale, array $data): Sale
    {
        $sale->update($data);

        return $sale;
    }

    public function delete(Sale $sale): void
    {
        // No cascade is configured, so clear the children before the header.
        $sale->taxes()->delete();
        $sale->payments()->delete();
        $sale->details()->delete();
        $sale->delete();
    }

    /**
     * Replace the sale's lines, each with the choices made against it.
     *
     * @param  list<array{detail: array<string, mixed>, modifiers: list<array<string, mixed>>, components: list<array<string, mixed>>}>  $details
     */
    public function syncDetails(Sale $sale, array $details): void
    {
        // Line ids are not stable across an edit, so the tax rows that point at them
        // go first. The modifier and component rows cascade from the detail at the
        // database level, so they need no explicit clearing here.
        $sale->taxes()->delete();
        $sale->details()->delete();

        foreach ($details as $line) {
            $detail = $sale->details()->create($line['detail']);

            foreach ($line['modifiers'] ?? [] as $modifier) {
                $detail->modifiers()->create($modifier);
            }

            foreach ($line['components'] ?? [] as $component) {
                $detail->components()->create($component);
            }
        }
    }

    /**
     * @param  list<array<string, mixed>>  $taxes
     */
    public function syncTaxes(Sale $sale, array $taxes): void
    {
        $sale->taxes()->delete();

        foreach ($taxes as $tax) {
            $sale->taxes()->create($tax);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $payments
     */
    public function syncPayments(Sale $sale, array $payments, ?string $userId = null): void
    {
        foreach ($payments as $payment) {
            $sale->payments()->create([
                'payment_method_id' => $payment['payment_method_id'],
                'amount' => $payment['amount'],
                'reference_number' => $payment['reference_number'] ?? null,
                'paid_at' => now(),
                'received_by' => $userId,
            ]);
        }
    }

    public function returnsCount(Sale $sale): int
    {
        return $sale->returns()->count();
    }

    public function latestNumber(string $prefix): ?string
    {
        return Sale::query()
            ->where('sale_number', 'like', $prefix.'%')
            ->max('sale_number');
    }

    /**
     * @return Collection<int, Sale>
     */
    public function held(?string $registerId = null): Collection
    {
        return Sale::query()
            ->where('status', 'held')
            ->when($registerId, fn ($query, string $id) => $query->where('register_id', $id))
            ->with(['customer:id,name'])
            ->withCount('details')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * @return Collection<int, Sale>
     */
    public function options(?string $customerId = null): Collection
    {
        return Sale::query()
            ->where('status', 'completed')
            ->when($customerId, fn ($query, string $id) => $query->where('customer_id', $id))
            ->orderByDesc('sale_date')
            ->limit(200)
            ->get(['id', 'sale_number', 'customer_id', 'branch_id', 'grand_total', 'sale_date']);
    }
}
