<?php

namespace App\Services;

use App\Models\Company;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use Illuminate\Validation\ValidationException;

class CompanyService
{
    public function __construct(private readonly CompanyRepositoryInterface $companies) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Company
    {
        return $this->companies->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Company $company, array $data): Company
    {
        return $this->companies->update($company, $data);
    }

    /**
     * Delete a company, refusing when branches still belong to it.
     *
     * @throws ValidationException
     */
    public function delete(Company $company): void
    {
        $branches = $this->companies->branchesCount($company);

        if ($branches > 0) {
            throw ValidationException::withMessages([
                'company' => "This company cannot be deleted because it has {$branches} branch(es).",
            ]);
        }

        $this->companies->delete($company);
    }
}
