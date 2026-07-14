<?php

namespace App\Repositories\Contracts;

use App\Models\Company;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface CompanyRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Company>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Company;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Company;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Company $company, array $data): Company;

    public function delete(Company $company): void;

    public function branchesCount(Company $company): int;

    /**
     * Companies for selection inputs.
     *
     * @return Collection<int, Company>
     */
    public function options(): Collection;
}
