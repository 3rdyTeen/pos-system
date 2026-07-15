<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AuthorizationService;
use App\Services\RolePermissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionSaveTest extends TestCase
{
    use RefreshDatabase;

    private RolePermissionService $service;

    private AuthorizationService $authorization;

    private Role $role;

    private Module $module;

    private Permission $view;

    private Permission $create;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(RolePermissionService::class);
        $this->authorization = app(AuthorizationService::class);

        $this->role = Role::factory()->create();
        // `inventory` is registered by the inventory data-migration, which has already
        // run under RefreshDatabase, and modules.code is unique — so adopt that row
        // rather than trying to create a second one.
        $this->module = Module::query()->firstOrCreate(
            ['code' => 'inventory'],
            ['name' => 'Inventory', 'is_enabled' => true],
        );
        $this->view = Permission::factory()->create(['code' => 'view']);
        $this->create = Permission::factory()->create(['code' => 'create']);
    }

    public function test_it_keeps_permission_selections_when_the_module_toggle_is_off(): void
    {
        $this->service->save($this->role, [[
            'module_id' => $this->module->id,
            'enabled' => false,
            'permission_ids' => [$this->view->id, $this->create->id],
        ]]);

        // Grants are preserved...
        $this->assertSame(2, $this->role->modulePermissions()->count());
        // ...but the module is not granted to the role.
        $this->assertSame(0, $this->role->modules()->count());
    }

    public function test_it_shows_the_remembered_selections_in_the_matrix_while_off(): void
    {
        $this->service->save($this->role, [[
            'module_id' => $this->module->id,
            'enabled' => false,
            'permission_ids' => [$this->view->id],
        ]]);

        $matrix = collect($this->service->matrix($this->role->fresh()))
            ->firstWhere('module_id', $this->module->id);

        $this->assertFalse($matrix['granted']);

        $viewCell = collect($matrix['permissions'])->firstWhere('permission_id', $this->view->id);
        $this->assertTrue($viewCell['granted']);
    }

    public function test_it_revokes_effective_permissions_while_the_module_is_off(): void
    {
        $this->service->save($this->role, [[
            'module_id' => $this->module->id,
            'enabled' => false,
            'permission_ids' => [$this->view->id, $this->create->id],
        ]]);

        $role = $this->role->fresh();

        $this->assertSame([], $this->authorization->permissionCodes($role));
        $this->assertSame([], $this->authorization->visibleModuleCodes($role));
    }

    public function test_it_restores_effective_access_when_the_module_is_re_enabled(): void
    {
        // Start with the module off but permissions selected.
        $this->service->save($this->role, [[
            'module_id' => $this->module->id,
            'enabled' => false,
            'permission_ids' => [$this->view->id, $this->create->id],
        ]]);

        // Re-enable the module (frontend re-sends the preserved selections).
        $this->service->save($this->role, [[
            'module_id' => $this->module->id,
            'enabled' => true,
            'permission_ids' => [$this->view->id, $this->create->id],
        ]]);

        $role = $this->role->fresh();

        $this->assertSame(1, $role->modules()->count());
        $this->assertContains('inventory.view', $this->authorization->permissionCodes($role));
        $this->assertContains('inventory.create', $this->authorization->permissionCodes($role));
        $this->assertSame(['inventory'], $this->authorization->visibleModuleCodes($role));
    }
}
