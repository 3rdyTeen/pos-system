<?php

namespace App\Repositories\Eloquent;

use App\Models\CustomerGroup;
use App\Repositories\Contracts\CustomerGroupRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class CustomerGroupRepository implements CustomerGroupRepositoryInterface
{
    /**
     * Groups for selection inputs (the customer form's group dropdown).
     *
     * @return Collection<int, CustomerGroup>
     */
    public function options(?string $companyId = null): Collection
    {
        return CustomerGroup::query()
            ->when($companyId, fn ($query, string $id) => $query->where('company_id', $id))
            ->orderBy('name')
            ->get(['id', 'name', 'company_id', 'discount_percentage']);
    }
}
