<?php

namespace App\Repositories\Eloquent;

use App\Models\Tax;
use App\Repositories\Contracts\TaxRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TaxRepository implements TaxRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'rate', 'status', 'created_at'];

    /**
     * Paginate taxes with search, company/type/status filters and sorting.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Tax>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Tax::query()
            ->with('company:id,name')
            ->when($filters['search'] ?? null, fn ($query, string $search) => $query->where('name', 'like', "%{$search}%"))
            ->when($filters['company_id'] ?? null, fn ($query, string $companyId) => $query->where('company_id', $companyId))
            ->when($filters['type'] ?? null, function ($query) use ($filters) {
                if ($filters['type'] !== 'all') {
                    $query->where('type', $filters['type']);
                }
            })
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?Tax
    {
        return Tax::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Tax
    {
        return Tax::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Tax $tax, array $data): Tax
    {
        $tax->update($data);

        return $tax;
    }

    public function delete(Tax $tax): void
    {
        $tax->delete();
    }
}
