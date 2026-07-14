<?php

namespace App\Repositories\Eloquent;

use App\Models\Role;
use App\Repositories\Contracts\RoleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class RoleRepository implements RoleRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'is_enabled', 'created_at'];

    /**
     * Paginate roles with search, status filter and sorting.
     *
     * Soft-deleted rows are excluded automatically by the SoftDeletes scope.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Role>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Role::query()
            ->withCount('users')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('is_enabled', $filters['status'] === 'enabled');
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?Role
    {
        return Role::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Role
    {
        return Role::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Role $role, array $data): Role
    {
        $role->update($data);

        return $role;
    }

    public function delete(Role $role): void
    {
        $role->delete();
    }

    public function assignedUsersCount(Role $role): int
    {
        return $role->users()->count();
    }

    /**
     * Enabled, non-deleted roles for selection inputs.
     *
     * @return Collection<int, Role>
     */
    public function enabled(): Collection
    {
        return Role::query()
            ->where('is_enabled', true)
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}
