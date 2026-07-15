<?php

namespace App\Repositories\Contracts;

use App\Models\CustomerGroup;
use Illuminate\Database\Eloquent\Collection;

interface CustomerGroupRepositoryInterface
{
    /**
     * Groups for selection inputs (the customer form's group dropdown).
     *
     * @return Collection<int, CustomerGroup>
     */
    public function options(?string $companyId = null): Collection;
}
