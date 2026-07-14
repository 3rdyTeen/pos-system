<?php

namespace App\Services;

use App\Models\Module;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleModulePermission;
use Illuminate\Support\Facades\DB;

class RolePermissionService
{
    /**
     * Build the module/permission matrix for a role: every enabled module with its
     * enabled permissions, flagged with what the role currently has granted. The
     * per-permission code is generated as "{module.code}.{permission.code}".
     *
     * @return list<array<string, mixed>>
     */
    public function matrix(Role $role): array
    {
        $modules = Module::query()->where('is_enabled', true)->orderBy('name')->get();
        $permissions = Permission::query()->where('is_enabled', true)->orderBy('created_at')->get();

        $grantedModuleIds = $role->modules()->pluck('modules.id')->all();

        $grantedPairs = $role->modulePermissions()
            ->get(['module_id', 'permission_id'])
            ->map(fn ($row) => $row->module_id.':'.$row->permission_id)
            ->all();

        return $modules->map(fn (Module $module) => [
            'module_id' => $module->id,
            'name' => $module->name,
            'code' => $module->code,
            'granted' => in_array($module->id, $grantedModuleIds, true),
            'permissions' => $permissions->map(fn (Permission $permission) => [
                'permission_id' => $permission->id,
                'name' => $permission->name,
                'code' => $permission->code,
                'generated_code' => $module->code.'.'.$permission->code,
                'granted' => in_array($module->id.':'.$permission->id, $grantedPairs, true),
            ])->all(),
        ])->all();
    }

    /**
     * Replace the role's module access and permission grants transactionally.
     * The per-role `enabled` flag controls module access (role_modules) only;
     * a module's permission selections are always preserved so that turning the
     * module off and on again restores them. Effective permissions are gated by
     * module access separately in AuthorizationService::permissionCodes().
     *
     * @param  list<array{module_id:string,enabled:bool,permission_ids:list<string>}>  $modules
     */
    public function save(Role $role, array $modules): void
    {
        $enabledModuleIds = Module::query()->where('is_enabled', true)->pluck('id')->all();
        $enabledPermissionIds = Permission::query()->where('is_enabled', true)->pluck('id')->all();

        DB::transaction(function () use ($role, $modules, $enabledModuleIds, $enabledPermissionIds) {
            $role->modulePermissions()->delete();
            $role->modules()->detach();

            foreach ($modules as $module) {
                $moduleId = $module['module_id'];

                if (! in_array($moduleId, $enabledModuleIds, true)) {
                    continue;
                }

                // The per-role toggle gates module access only.
                if (! empty($module['enabled'])) {
                    $role->modules()->attach($moduleId);
                }

                // Permission selections are persisted regardless of the toggle.
                foreach ($module['permission_ids'] ?? [] as $permissionId) {
                    if (! in_array($permissionId, $enabledPermissionIds, true)) {
                        continue;
                    }

                    RoleModulePermission::query()->create([
                        'role_id' => $role->id,
                        'module_id' => $moduleId,
                        'permission_id' => $permissionId,
                    ]);
                }
            }
        });
    }
}
