<?php

namespace App\Repositories\Eloquent;

use App\Models\Navigation;
use App\Repositories\Contracts\NavigationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NavigationRepository implements NavigationRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'code', 'order', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Navigation>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'order';
        $direction = ($filters['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return Navigation::query()
            ->with(['module:id,name,code', 'parent:id,name'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%");
                });
            })
            ->when($filters['module_id'] ?? null, fn ($query, string $moduleId) => $query->where('module_id', $moduleId))
            ->orderBy('module_id')
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();
    }

    public function findById(string $id): ?Navigation
    {
        return Navigation::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Navigation
    {
        return Navigation::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Navigation $navigation, array $data): Navigation
    {
        $navigation->update($data);

        return $navigation;
    }

    public function delete(Navigation $navigation): void
    {
        $navigation->delete();
    }

    /**
     * Highest order value among siblings sharing the same parent (null = root level).
     */
    public function maxOrder(?string $parentId): int
    {
        return (int) Navigation::query()
            ->where('parent_id', $parentId)
            ->max('order');
    }

    /**
     * Reassign a deleted navigation's children to the root so none are orphaned.
     */
    public function promoteChildrenToRoot(string $parentId): void
    {
        Navigation::query()
            ->where('parent_id', $parentId)
            ->update(['parent_id' => null]);
    }
}
