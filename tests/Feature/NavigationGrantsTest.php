<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\Navigation;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Services\AuthorizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NavigationGrantsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Every module that backs a navigation entry must be granted to every role, with
     * the module toggle on so the entry is actually visible.
     */
    public function test_every_role_can_see_every_navigation_backed_module(): void
    {
        $this->seed();

        $navModuleCodes = Module::query()
            ->whereIn('id', Navigation::query()->whereNotNull('module_id')->distinct()->pluck('module_id'))
            ->pluck('code');

        $this->assertNotEmpty($navModuleCodes);

        $authorization = app(AuthorizationService::class);

        foreach (Role::query()->get() as $role) {
            $visible = $authorization->visibleModuleCodes($role);

            foreach ($navModuleCodes as $code) {
                $this->assertContains($code, $visible, "Role {$role->name} cannot see module {$code}.");
            }
        }
    }

    public function test_every_role_holds_the_full_permission_set_on_those_modules(): void
    {
        $this->seed();

        $moduleIds = Module::query()
            ->whereIn('id', Navigation::query()->whereNotNull('module_id')->distinct()->pluck('module_id'))
            ->pluck('id');

        $permissionCount = Permission::query()->count();

        foreach (Role::query()->get() as $role) {
            foreach ($moduleIds as $moduleId) {
                $this->assertSame(
                    $permissionCount,
                    RoleModulePermission::query()->where('role_id', $role->id)->where('module_id', $moduleId)->count(),
                    "Role {$role->name} is missing permissions on module {$moduleId}."
                );
            }
        }
    }

    /**
     * The grant migration runs before any role exists on a fresh install, so it must
     * not fail or leave partial state when there is nothing to grant.
     */
    public function test_the_grant_migration_is_a_no_op_without_roles(): void
    {
        // RefreshDatabase has already migrated with an empty roles table.
        $this->assertSame(0, RoleModulePermission::query()->count());
        $this->assertGreaterThan(0, Navigation::query()->count());
    }
}
