<?php

namespace App\Repositories\Contracts;

use App\Models\PosProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PosProfileRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PosProfile>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PosProfile;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PosProfile $profile, array $data): PosProfile;

    public function delete(PosProfile $profile): void;

    /**
     * Demote every other default for the company, so at most one profile is the
     * fallback at a time.
     */
    public function clearDefaultExcept(PosProfile $profile): void;

    /**
     * Profiles for selection inputs (the register form's profile dropdown).
     *
     * @return Collection<int, PosProfile>
     */
    public function options(): Collection;
}
