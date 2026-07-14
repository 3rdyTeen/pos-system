<?php

namespace App\Repositories\Eloquent;

use App\Models\Unit;
use App\Repositories\Contracts\UnitRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class UnitRepository implements UnitRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'abbreviation', 'created_at'];

    /**
     * Paginate units with search, company filter and sorting.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Unit>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Unit::query()
            ->with(['company:id,name', 'baseUnit:id,name'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('abbreviation', 'like', "%{$search}%");
                });
            })
            ->when($filters['company_id'] ?? null, fn ($query, string $companyId) => $query->where('company_id', $companyId))
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?Unit
    {
        return Unit::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Unit
    {
        return Unit::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Unit $unit, array $data): Unit
    {
        $unit->update($data);

        return $unit;
    }

    public function delete(Unit $unit): void
    {
        $unit->delete();
    }

    /**
     * Units for selection inputs (e.g. the base-unit dropdown).
     *
     * @return Collection<int, Unit>
     */
    public function options(?string $companyId = null): Collection
    {
        return Unit::query()
            ->when($companyId, fn ($query, string $id) => $query->where('company_id', $id))
            ->orderBy('name')
            ->get(['id', 'name', 'abbreviation', 'company_id']);
    }
}
