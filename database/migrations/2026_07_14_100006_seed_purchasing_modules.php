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
     * Module codes registered by this migration. `purchasing` is a grouping module
     * that only backs the parent navigation node.
     *
     * @var list<string>
     */
    private array $moduleCodes = ['purchasing', 'purchase_orders', 'purchase_returns'];

    /**
     * Register the Purchasing modules + navigation and grant every role full access.
     * Idempotent so it is safe to re-run.
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
            'purchasing' => 'Purchasing',
            'purchase_orders' => 'Purchase orders',
            'purchase_returns' => 'Purchase returns',
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

        // Parent grouping node — rendered as a collapsible trigger (never navigated),
        // so its URL is unique and does not back a route.
        $parent = Navigation::query()->firstOrCreate(
            ['code' => 'purchasing'],
            [
                'module_id' => $modules['purchasing']->id,
                'name' => 'Purchasing',
                'url' => '/purchasing',
                'icon' => 'shopping-bag',
                'order' => $base + 1,
            ],
        );

        $children = [
            ['Purchase orders', 'purchase_orders', '/purchase-orders', 'clipboard-list'],
            ['Returns', 'purchase_returns', '/purchase-returns', 'undo-2'],
        ];

        foreach ($children as $index => [$name, $code, $url, $icon]) {
            Navigation::query()->firstOrCreate(
                ['code' => $code],
                [
                    'module_id' => $modules[$code]->id,
                    'parent_id' => $parent->id,
                    'name' => $name,
                    'url' => $url,
                    'icon' => $icon,
                    'order' => $base + 2 + $index,
                ],
            );
        }
    }

    /**
     * Grant every role access to the modules with the full set of permissions.
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
