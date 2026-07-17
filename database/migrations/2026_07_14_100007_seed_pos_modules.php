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
     * The `sales` parent is deliberately excluded: it is also seeded by
     * DatabaseSeeder as a demo module, so this migration adopts it rather than
     * owning it, and down() must not remove it. Same arrangement as the
     * inventory seed.
     *
     * @var list<string>
     */
    private array $moduleCodes = ['pos_terminal', 'sales_history', 'sales_returns', 'pos_profiles'];

    /**
     * Register the POS pages under the existing Sales navigation node and grant
     * every role full access. Idempotent so it is safe to re-run.
     */
    public function up(): void
    {
        $parent = $this->resolveParent();
        $modules = $this->seedModules();
        $this->seedNavigations($parent, $modules);
        $this->grantAllRoles($modules);
    }

    /**
     * The Sales grouping node the POS pages hang off.
     *
     * DatabaseSeeder seeds `sales` as a demo module pointing at a placeholder page.
     * Adopting it turns it into a real grouping node: once it has children NavMain
     * renders it as a collapsible trigger, so its `/sales` url stops being navigated
     * and the placeholder route it used to point at is no longer reachable from the
     * sidebar. That route is replaced by the pages seeded below.
     */
    private function resolveParent(): Navigation
    {
        $module = Module::query()->firstOrCreate(
            ['code' => 'sales'],
            ['name' => 'Sales', 'is_enabled' => true],
        );

        return Navigation::query()->firstOrCreate(
            ['code' => 'sales'],
            [
                'module_id' => $module->id,
                'name' => 'Sales',
                'url' => '/sales',
                'icon' => 'shopping-cart',
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
            'pos_terminal' => 'POS terminal',
            'sales_history' => 'Sales',
            'sales_returns' => 'Sales returns',
            'pos_profiles' => 'POS profiles',
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
            ['Terminal', 'pos_terminal', '/pos', 'scan-line'],
            ['Sales', 'sales_history', '/sales-history', 'receipt'],
            ['Returns', 'sales_returns', '/sales-returns', 'undo-2'],
            ['Terminal profiles', 'pos_profiles', '/pos-profiles', 'sliders-horizontal'],
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
     * Reverse the registration for the child pages only, leaving the shared
     * `sales` parent in place.
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
