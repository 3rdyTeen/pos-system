<?php

namespace App\Repositories\Eloquent;

use App\Models\Register;
use App\Repositories\Contracts\RegisterRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RegisterRepository implements RegisterRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'code', 'status', 'created_at'];

    /**
     * Paginate registers with search, branch/status filters and sorting.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Register>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Register::query()
            ->with('branch:id,name')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($filters['branch_id'] ?? null, fn ($query, string $branchId) => $query->where('branch_id', $branchId))
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?Register
    {
        return Register::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Register
    {
        return Register::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Register $register, array $data): Register
    {
        $register->update($data);

        return $register;
    }

    public function delete(Register $register): void
    {
        $register->delete();
    }
}
