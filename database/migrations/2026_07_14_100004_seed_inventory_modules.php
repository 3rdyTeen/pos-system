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
     * Child module codes registered by this migration.
     *
     * The `inventory` parent is deliberately excluded: it is also seeded by
     * DatabaseSeeder as a demo module, so this migration adopts it rather than
     * owning it, and down() must not remove it.
     *
     * @var list<string>
     */
    private array $moduleCodes = ['warehouses', 'stock_balances', 'stock_adjustments', 'stock_transfers'];

    /**
     * Register the Inventory pages under the existing Inventory navigation node and
     * grant every role full access. Idempotent so it is safe to re-run.
     */
    public function up(): void
    {
        $parent = $this->resolveParent();
        $modules = $this->seedModules();
        $this->seedNavigations($parent, $modules);
        $this->grantAllRoles($modules);
    }

    /**
     * The Inventory grouping node the new pages hang off.
     *
     * On a fresh install migrations run before DatabaseSeeder, so this node does not
     * exist yet and is created here; on an existing database it is already present
     * and gets reused. Either way DatabaseSeeder must firstOrCreate it rather than
     * create it, or the unique code constraint would fire.
     */
    private function resolveParent(): Navigation
    {
        $module = Module::query()->firstOrCreate(
            ['code' => 'inventory'],
            ['name' => 'Inventory', 'is_enabled' => true],
        );

        return Navigation::query()->firstOrCreate(
            ['code' => 'inventory'],
            [
                'module_id' => $module->id,
                'name' => 'Inventory',
                'url' => '/inventory',
                'icon' => 'package',
                'order' => (int) Navigation::query()->max('order') + 1,
            ],
        );
    }

    /**
     * @return array<string, Module>
     */
    private function seedModules(): array
    {
        $definitions = [
            'warehouses' => 'Warehouses',
            'stock_balances' => 'Stock on hand',
            'stock_adjustments' => 'Stock adjustments',
            'stock_transfers' => 'Stock transfers',
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
    private function seedNavigations(Navigation $parent, array $modules): void
    {
        $base = (int) Navigation::query()->max('order');

        $children = [
            ['Warehouses', 'warehouses', '/warehouses', 'warehouse'],
            ['Stock on hand', 'stock_balances', '/stock-balances', 'layers'],
            ['Adjustments', 'stock_adjustments', '/stock-adjustments', 'clipboard-check'],
            ['Transfers', 'stock_transfers', '/stock-transfers', 'arrow-left-right'],
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
                    'order' => $base + 1 + $index,
                ],
            );
        }
    }

    /**
     * Grant every role access to the new modules with the full set of permissions.
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
     * Reverse the registration for the child pages only, leaving the shared
     * `inventory` parent in place.
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
