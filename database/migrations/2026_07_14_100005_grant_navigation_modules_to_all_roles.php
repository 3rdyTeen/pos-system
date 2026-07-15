<?php

use App\Models\Module;
use App\Models\Navigation;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleModulePermission;
use Illuminate\Database\Migrations\Migration;

/**
 * Grants every navigation-backed module to every role, with the full permission set.
 *
 * Access needs two things (see AuthorizationService): a `role_modules` row, which is
 * what makes the navigation visible and the page reachable, and `role_module_permissions`
 * rows, which drive the individual actions. Both are written here.
 *
 * This exists because the earlier seed data-migrations grant roles at the moment they
 * run, and on a fresh install that is before any role exists — so their grants are a
 * no-op and DatabaseSeeder has to repeat them. Modules missing from that list (the
 * Organization group among them) ended up granted to the administrator only. This
 * migration reconciles the whole set forward, without re-running anything.
 */
return new class extends Migration
{
    /**
     * Grant every role access to every module that backs a navigation entry.
     * Idempotent, so it is safe to re-run.
     */
    public function up(): void
    {
        $moduleIds = Module::query()
            ->whereIn('id', Navigation::query()->whereNotNull('module_id')->distinct()->pluck('module_id'))
            ->pluck('id');

        $permissionIds = Permission::query()->pluck('id');

        if ($moduleIds->isEmpty() || $permissionIds->isEmpty()) {
            return;
        }

        Role::query()->each(function (Role $role) use ($moduleIds, $permissionIds) {
            // The module toggle: without this the navigation stays hidden and the
            // page 403s, whatever permissions are attached.
            $role->modules()->syncWithoutDetaching($moduleIds->all());

            foreach ($moduleIds as $moduleId) {
                foreach ($permissionIds as $permissionId) {
                    RoleModulePermission::query()->firstOrCreate([
                        'role_id' => $role->id,
                        'module_id' => $moduleId,
                        'permission_id' => $permissionId,
                    ]);
                }
            }
        });
    }

    /**
     * Not reversible: the grants this adds are indistinguishable from ones that were
     * already there, so rolling back would revoke access this migration never gave.
     */
    public function down(): void
    {
        // Intentionally left empty.
    }
};
