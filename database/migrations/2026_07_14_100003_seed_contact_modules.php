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
     * Module codes registered by this migration. Unlike Catalog these are two
     * standalone top-level entries, so there is no grouping module.
     *
     * @var list<string>
     */
    private array $moduleCodes = ['suppliers', 'customers'];

    /**
     * Register the Suppliers + Customers modules + navigation and grant every role
     * full access. Idempotent so it is safe to re-run.
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
            'suppliers' => 'Suppliers',
            'customers' => 'Customers',
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
     * @param  array<string, Module>  $modules
     */
    private function seedNavigations(array $modules): void
    {
        $base = (int) Navigation::query()->max('order');

        // Top-level entries: no parent_id, so each renders as its own sidebar link.
        $items = [
            ['Suppliers', 'suppliers', '/suppliers', 'truck'],
            ['Customers', 'customers', '/customers', 'users-round'],
        ];

        foreach ($items as $index => [$name, $code, $url, $icon]) {
            Navigation::query()->firstOrCreate(
                ['code' => $code],
                [
                    'module_id' => $modules[$code]->id,
                    'name' => $name,
                    'url' => $url,
                    'icon' => $icon,
                    'order' => $base + 1 + $index,
                ],
            );
        }
    }

    /**
     * Grant every role access to both modules with the full set of permissions.
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
     * Reverse the registration: remove grants, navigations and modules for these codes.
     */
    public function down(): void
    {
        $moduleIds = Module::query()->whereIn('code', $this->moduleCodes)->pluck('id');

        RoleModulePermission::query()->whereIn('module_id', $moduleIds)->delete();

        // Detach role_modules pivot rows.
        foreach (Role::query()->get() as $role) {
            $role->modules()->detach($moduleIds->all());
        }

        Navigation::query()->whereIn('code', $this->moduleCodes)->forceDelete();
        Module::query()->whereIn('code', $this->moduleCodes)->forceDelete();
    }
};
