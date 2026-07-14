<?php

namespace App\Services;

use App\Models\Navigation;
use App\Repositories\Contracts\NavigationRepositoryInterface;

class NavigationService
{
    public function __construct(private readonly NavigationRepositoryInterface $navigations) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Navigation
    {
        $data['order'] = $this->resolveOrder($data);

        return $this->navigations->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Navigation $navigation, array $data): Navigation
    {
        $data['order'] = $this->resolveOrder($data);

        return $this->navigations->update($navigation, $data);
    }

    /**
     * Deleting a navigation promotes its children to the root so none are orphaned.
     */
    public function delete(Navigation $navigation): void
    {
        $this->navigations->promoteChildrenToRoot($navigation->id);
        $this->navigations->delete($navigation);
    }

    /**
     * Order is optional: when blank, place the item last within its parent scope
     * (current max order + 1).
     *
     * @param  array<string, mixed>  $data
     */
    private function resolveOrder(array $data): int
    {
        if (isset($data['order']) && $data['order'] !== '' && $data['order'] !== null) {
            return (int) $data['order'];
        }

        return $this->navigations->maxOrder($data['parent_id'] ?? null) + 1;
    }
}
