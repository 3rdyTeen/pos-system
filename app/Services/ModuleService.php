<?php

namespace App\Services;

use App\Models\Module;
use App\Repositories\Contracts\ModuleRepositoryInterface;

class ModuleService
{
    public function __construct(private readonly ModuleRepositoryInterface $modules) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Module
    {
        return $this->modules->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Module $module, array $data): Module
    {
        return $this->modules->update($module, $data);
    }

    public function toggle(Module $module): Module
    {
        // Disabled modules (and their grants) are excluded by the authorization queries,
        // so no destructive cascade is needed here.
        return $this->modules->update($module, ['is_enabled' => ! $module->is_enabled]);
    }

    public function delete(Module $module): void
    {
        $this->modules->delete($module);
    }
}
