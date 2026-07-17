<?php

namespace App\Repositories\Eloquent;

use App\Models\ModifierGroup;
use App\Repositories\Contracts\ModifierGroupRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ModifierGroupRepository implements ModifierGroupRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'selection_type', 'status', 'sort_order', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, ModifierGroup>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'sort_order';
        $direction = ($filters['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return ModifierGroup::query()
            ->with(['options', 'company:id,name'])
            ->withCount(['options', 'products'])
            ->when($filters['search'] ?? null, fn ($query, string $search) => $query->where('name', 'like', "%{$search}%"))
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ModifierGroup
    {
        return ModifierGroup::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ModifierGroup $group, array $data): ModifierGroup
    {
        $group->update($data);

        return $group;
    }

    public function delete(ModifierGroup $group): void
    {
        // Options and the product pivot cascade at the database level. Rows already
        // written against a sale keep their copied name and price, so deleting a
        // group never rewrites history.
        $group->delete();
    }

    /**
     * @param  list<array<string, mixed>>  $options
     */
    public function syncOptions(ModifierGroup $group, array $options): void
    {
        $keep = [];

        foreach ($options as $index => $option) {
            $row = $group->options()->updateOrCreate(
                ['id' => $option['id'] ?? null],
                [
                    'name' => $option['name'],
                    'price_delta' => $option['price_delta'] ?? 0,
                    'product_id' => $option['product_id'] ?? null,
                    'is_default' => $option['is_default'] ?? false,
                    'sort_order' => $index,
                ],
            );

            $keep[] = $row->id;
        }

        // Options are updated in place rather than replaced, because sales_detail_modifiers
        // points at them for reporting and a delete-then-recreate would orphan every
        // one of those links on a trivial rename.
        $group->options()->whereNotIn('id', $keep)->delete();
    }

    /**
     * @param  list<string>  $productIds
     */
    public function syncProducts(ModifierGroup $group, array $productIds): void
    {
        $group->products()->sync($productIds);
    }

    /**
     * @return Collection<int, ModifierGroup>
     */
    public function options(): Collection
    {
        return ModifierGroup::query()
            ->where('status', 'active')
            ->with('options')
            ->orderBy('sort_order')
            ->get(['id', 'name', 'selection_type', 'is_required', 'company_id']);
    }
}
