<?php

namespace App\Repositories\Eloquent;

use App\Models\PosProfile;
use App\Repositories\Contracts\PosProfileRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PosProfileRepository implements PosProfileRepositoryInterface
{
    /**
     * Columns that may be sorted by from the client.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'code', 'picking_mode', 'status', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PosProfile>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'name';
        $direction = ($filters['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return PosProfile::query()
            ->with(['company:id,name'])
            ->withCount('registers')
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

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PosProfile
    {
        return PosProfile::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PosProfile $profile, array $data): PosProfile
    {
        $profile->update($data);

        return $profile;
    }

    public function delete(PosProfile $profile): void
    {
        // Registers point at the profile with a nullOnDelete constraint, so they
        // fall back to the company default rather than breaking.
        $profile->delete();
    }

    public function clearDefaultExcept(PosProfile $profile): void
    {
        PosProfile::query()
            ->where('company_id', $profile->company_id)
            ->whereKeyNot($profile->id)
            ->where('is_default', true)
            ->update(['is_default' => false]);
    }

    /**
     * @return Collection<int, PosProfile>
     */
    public function options(): Collection
    {
        return PosProfile::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'company_id', 'picking_mode', 'is_default']);
    }
}
