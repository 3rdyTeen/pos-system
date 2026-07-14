<?php

namespace App\Repositories\Eloquent;

use App\Models\Currency;
use App\Repositories\Contracts\CurrencyRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CurrencyRepository implements CurrencyRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['code', 'name', 'status', 'created_at'];

    /**
     * Paginate currencies with search, status filter and sorting.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Currency>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Currency::query()
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?Currency
    {
        return Currency::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Currency
    {
        return Currency::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Currency $currency, array $data): Currency
    {
        $currency->update($data);

        return $currency;
    }

    public function delete(Currency $currency): void
    {
        $currency->delete();
    }
}
