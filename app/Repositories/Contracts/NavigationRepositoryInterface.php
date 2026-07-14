<?php

namespace App\Repositories\Contracts;

use App\Models\Navigation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface NavigationRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Navigation>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Navigation;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Navigation;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Navigation $navigation, array $data): Navigation;

    public function delete(Navigation $navigation): void;

    public function maxOrder(?string $parentId): int;

    public function promoteChildrenToRoot(string $parentId): void;
}
