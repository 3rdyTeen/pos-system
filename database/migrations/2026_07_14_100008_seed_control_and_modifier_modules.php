<?php

use App\Models\Module;
use App\Models\Navigation;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleModulePermission;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Module codes registered by this migration.
     *
     * Both parents (`system_settings`, `catalog`) already exist and are adopted
     * rather than owned, so down() must not remove them.
     *
     * @var list<string>
     */
    private array $moduleCodes = ['feature_controls', 'modifier_groups'];

    /**
     * Register the feature control panel under System Settings, and modifier groups
     * under Catalog. Idempotent so it is safe to re-run.
     */
    public function up(): void
    {
        $modules = $this->seedModules();
        $this->seedNavigations($modules);
        $this->grantAllRoles($modules);
    }

    /**
     * @return array<string, Module>
     */
    private function seedModules(): array
    {
        $definitions = [
            'feature_controls' => 'Feature controls',
            'modifier_groups' => 'Modifier groups',
        ];

        $modules = [];
        foreach ($definitions as $code => $name) {
            $modules[$code] = Module::query()->firstOrCreate(
                ['code' => $code],
                ['name' => $name, 'is_enabled' => true],
            );
        }

        return $modules;
    }

    /**
     * Hang each page off the parent it belongs under.
     *
     * Feature controls sit with the other company-wide configuration; modifier
     * groups sit with the catalogue they describe.
     *
     * @param  array<string, Module>  $modules
     */
    private function seedNavigations(array $modules): void
    {
        $children = [
            ['feature_controls', 'Feature controls', '/feature-controls', 'toggle-right', 'system_settings'],
            ['modifier_groups', 'Modifier groups', '/modifier-groups', 'list-plus', 'catalog'],
        ];

        foreach ($children as [$code, $name, $url, $icon, $parentCode]) {
            $parent = Navigation::query()->where('code', $parentCode)->first();

            // The parent is seeded by DatabaseSeeder. If it is somehow missing the
            // page still registers, just at the top level rather than orphaned.
            Navigation::query()->firstOrCreate(
                ['code' => $code],
                [
                    'module_id' => $modules[$code]->id,
                    'parent_id' => $parent?->id,
                    'name' => $name,
                    'url' => $url,
                    'icon' => $icon,
                    'order' => (int) Navigation::query()->max('order') + 1,
                ],
            );
        }
    }

    /**
     * Grant every role access to the new modules with the full set of permissions.
     *
     * On a fresh install this is a no-op because migrations run before any role
     * exists; DatabaseSeeder then grants every navigation-backed module instead.
     *
     * @param  array<string, Module>  $modules
     */
    private function grantAllRoles(array $modules): void
    {
        $permissions = Permission::query()->get();

        Role::query()->each(function (Role $role) use ($modules, $permissions) {
            foreach ($modules as $module) {
                $role->modules()->syncWithoutDetaching([$module->id]);

                foreach ($permissions as $permission) {
                    RoleModulePermission::query()->firstOrCreate([
                        'role_id' => $role->id,
                        'module_id' => $module->id,
                        'permission_id' => $permission->id,
                    ]);
                }
            }
        });
    }

    /**
     * Reverse the registration for these pages only, leaving the shared parents.
     */
    public function down(): void
    {
        $moduleIds = Module::query()->whereIn('code', $this->moduleCodes)->pluck('id');

        RoleModulePermission::query()->whereIn('module_id', $moduleIds)->delete();

        foreach (Role::query()->get() as $role) {
            $role->modules()->detach($moduleIds->all());
        }

        Navigation::query()->whereIn('code', $this->moduleCodes)->forceDelete();
        Module::query()->whereIn('code', $this->moduleCodes)->forceDelete();
    }
};
