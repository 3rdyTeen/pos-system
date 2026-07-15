<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Navigation;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the RBAC data: permissions, modules, navigations, roles + grants, users.
     */
    public function run(): void
    {
        $permissions = $this->seedPermissions();
        $modules = $this->seedModules();
        $this->seedNavigations($modules);

        $roles = $this->seedRoles();

        // Administrator: full access to every module and permission.
        $this->grantAll($roles['admin'], $modules, $permissions);

        // Editor: only the Inventory module with view access (demonstrates gating).
        $this->grant($roles['editor'], $modules['inventory'], [$permissions['view']]);

        // Modules registered by later data-migrations (System Settings, Catalog) are
        // available to every role. Granted here too because migrations run before
        // roles exist, so the migrations' own grant is a no-op on a fresh install.
        $this->grantMigratedModulesToAllRoles($permissions);

        $this->seedUsers($roles['admin'], $roles['editor']);
    }

    /**
     * Grant every role full access to the modules registered by data-migrations
     * (System Settings + Catalog groups, Suppliers, Customers).
     *
     * @param  array<string, Permission>  $permissions
     */
    private function grantMigratedModulesToAllRoles(array $permissions): void
    {
        $modules = Module::query()
            ->whereIn('code', [
                'system_settings', 'taxes', 'units', 'payment_methods', 'currencies',
                'catalog', 'products', 'product_categories',
                'suppliers', 'customers',
            ])
            ->get();

        foreach (Role::all() as $role) {
            foreach ($modules as $module) {
                $this->grant($role, $module, array_values($permissions));
            }
        }
    }

    /**
     * @return array<string, Permission>
     */
    private function seedPermissions(): array
    {
        $definitions = [
            'view' => 'View',
            'create' => 'Create',
            'update' => 'Update',
            'delete' => 'Delete',
            'export' => 'Export',
            'approve' => 'Approve',
            'print' => 'Print',
        ];

        $permissions = [];
        foreach ($definitions as $code => $name) {
            $permissions[$code] = Permission::query()->create([
                'name' => $name,
                'code' => $code,
                'is_enabled' => true,
            ]);
        }

        return $permissions;
    }

    /**
     * @return array<string, Module>
     */
    private function seedModules(): array
    {
        $definitions = [
            'administration' => 'Administration',
            'inventory' => 'Inventory',
            'sales' => 'Sales',
            'reports' => 'Reports',
            'roles' => 'Roles',
            'dashboard' => 'Dashboard',
            'settings' => 'Settings',
            'users' => 'Users',
            'modules' => 'Modules',
            'permissions' => 'Permissions',
            'navigations' => 'Navigations',
        ];

        $modules = [];
        foreach ($definitions as $code => $name) {
            $modules[$code] = Module::query()->create([
                'name' => $name,
                'code' => $code,
                'is_enabled' => true,
            ]);
        }

        return $modules;
    }

    /**
     * @param  array<string, Module>  $modules
     */
    private function seedNavigations(array $modules): void
    {
        $parents = [];
        $parentNavs = [
            ['Dashboard', 'dashboard', '/dashboard', 'layout-grid'],
            ['Inventory', 'inventory', '/inventory', 'package'],
            ['Sales', 'sales', '/sales', 'shopping-cart'],
            ['Reports', 'reports', '/reports', 'file-text'],
            ['Settings', 'settings', '/settings', 'settings'],
        ];

        foreach ($parentNavs as $index => [$name, $code, $url, $icon]) {
            $parents[$code] = Navigation::query()->create([
                'module_id' => $modules[$code]->id ?? null,
                'name' => $name,
                'code' => $code,
                'url' => $url,
                'icon' => $icon,
                'order' => $index + 1,
            ]);
        }

        $childNavs = [
            ['Modules', 'modules', 'settings', '/modules', 'boxes'],
            ['Permissions', 'permissions', 'settings', '/permissions', 'key-round'],
            ['Navigations', 'navigations', 'settings', '/navigations', 'list-tree'],
            ['Roles', 'roles', 'settings', '/roles', 'shield'],
            ['Users', 'users', 'settings', '/users', 'users'],
        ];

        foreach ($childNavs as $index => [$name, $code, $parent, $url, $icon]) {
            Navigation::query()->create([
                'module_id' => $modules[$code]->id ?? null,
                'parent_id' => $parents[$parent]->id ?? null,
                'name' => $name,
                'code' => $code,
                'url' => $url,
                'icon' => $icon,
                'order' => 7 + $index,
            ]);
        }
    }

    /**
     * @return array{admin: Role, editor: Role}
     */
    private function seedRoles(): array
    {
        $admin = Role::factory()->create([
            'name' => 'Administrator',
            'description' => 'Full access to the application.',
        ]);

        $editor = Role::factory()->create([
            'name' => 'Editor',
            'description' => 'Can manage content.',
        ]);

        Role::factory()->disabled()->create([
            'name' => 'Legacy',
            'description' => 'Deprecated role kept for existing users.',
        ]);

        return ['admin' => $admin, 'editor' => $editor];
    }

    /**
     * @param  array<string, Module>  $modules
     * @param  array<string, Permission>  $permissions
     */
    private function grantAll(Role $role, array $modules, array $permissions): void
    {
        foreach ($modules as $module) {
            $this->grant($role, $module, array_values($permissions));
        }
    }

    /**
     * @param  list<Permission>  $permissions
     */
    private function grant(Role $role, Module $module, array $permissions): void
    {
        $role->modules()->syncWithoutDetaching([$module->id]);

        foreach ($permissions as $permission) {
            RoleModulePermission::query()->firstOrCreate([
                'role_id' => $role->id,
                'module_id' => $module->id,
                'permission_id' => $permission->id,
            ]);
        }
    }

    private function seedUsers(Role $admin, Role $editor): void
    {
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role_id' => $admin->id,
        ]);

        User::factory()->create([
            'name' => 'Editor User',
            'email' => 'editor@example.com',
            'role_id' => $editor->id,
        ]);

        User::factory(9)->create([
            'role_id' => $admin->id,
        ]);
    }
}
