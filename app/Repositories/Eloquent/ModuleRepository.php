<?php

namespace App\Repositories\Eloquent;

use App\Models\Module;
use App\Repositories\Contracts\ModuleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ModuleRepository implements ModuleRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'code', 'is_enabled', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Module>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return Module::query()
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

    public function findById(string $id): ?Module
    {
        return Module::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Module
    {
        return Module::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Module $module, array $data): Module
    {
        $module->update($data);

        return $module;
    }

    public function delete(Module $module): void
    {
        $module->delete();
    }

    /**
     * Enabled, non-deleted modules for selection inputs.
     *
     * @return Collection<int, Module>
     */
    public function enabled(): Collection
    {
        return Module::query()
            ->where('is_enabled', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);
    }
}
