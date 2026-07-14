<?php

namespace App\Repositories\Eloquent;

use App\Models\Permission;
use App\Repositories\Contracts\PermissionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PermissionRepository implements PermissionRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'code', 'is_enabled', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Permission>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Permission::query()
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('is_enabled', $filters['status'] === 'enabled');
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function findById(string $id): ?Permission
    {
        return Permission::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Permission
    {
        return Permission::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Permission $permission, array $data): Permission
    {
        $permission->update($data);

        return $permission;
    }

    public function delete(Permission $permission): void
    {
        $permission->delete();
    }

    /**
     * Enabled, non-deleted permissions ordered for display.
     *
     * @return Collection<int, Permission>
     */
    public function enabled(): Collection
    {
        return Permission::query()
            ->where('is_enabled', true)
            ->orderBy('created_at')
            ->get(['id', 'name', 'code']);
    }
}
