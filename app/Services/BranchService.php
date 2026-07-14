<?php

namespace App\Services;

use App\Models\Branch;
use App\Repositories\Contracts\BranchRepositoryInterface;
use Illuminate\Validation\ValidationException;

class BranchService
{
    public function __construct(private readonly BranchRepositoryInterface $branches) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Branch
    {
        return $this->branches->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Branch $branch, array $data): Branch
    {
        return $this->branches->update($branch, $data);
    }

    /**
     * Delete a branch, refusing when registers or users still reference it.
     *
     * @throws ValidationException
     */
    public function delete(Branch $branch): void
    {
        $registers = $this->branches->registersCount($branch);

        if ($registers > 0) {
            throw ValidationException::withMessages([
                'branch' => "This branch cannot be deleted because it has {$registers} register(s).",
            ]);
        }

        $users = $this->branches->assignedUsersCount($branch);

        if ($users > 0) {
            throw ValidationException::withMessages([
                'branch' => "This branch cannot be deleted because it is assigned to {$users} user(s).",
            ]);
        }

        $this->branches->delete($branch);
    }
}
