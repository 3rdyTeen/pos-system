<?php

use App\Models\Company;
use App\Models\Currency;
use App\Models\Module;
use App\Models\Navigation;
use App\Models\PaymentMethod;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\Tax;
use App\Models\Unit;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Module codes registered by this migration. `system_settings` is a grouping
     * module that only backs the parent navigation node.
     *
     * @var list<string>
     */
    private array $moduleCodes = ['system_settings', 'taxes', 'units', 'payment_methods', 'currencies'];

    /**
     * Register the System Settings modules + navigation, grant every role full
     * access, and seed common reference defaults. Idempotent so it is safe to re-run.
     */
    public function up(): void
    {
        $modules = $this->seedModules();
        $this->seedNavigations($modules);
        $this->grantAllRoles($modules);
        $this->seedDefaults();
    }

    /**
     * @return array<string, Module>
     */
    private function seedModules(): array
    {
        $definitions = [
            'system_settings' => 'Settings',
            'taxes' => 'Taxes',
            'units' => 'Units',
            'payment_methods' => 'Payment Methods',
            'currencies' => 'Currencies',
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
            ['code' => 'system_settings'],
            [
                'module_id' => $modules['system_settings']->id,
                'name' => 'Settings',
                'url' => '/system-settings',
                'icon' => 'settings-2',
                'order' => $base + 1,
            ],
        );

        $children = [
            ['Taxes', 'taxes', '/taxes', 'receipt'],
            ['Units', 'units', '/units', 'ruler'],
            ['Payment Methods', 'payment_methods', '/payment-methods', 'credit-card'],
            ['Currencies', 'currencies', '/currencies', 'coins'],
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
     * Grant every role access to all five modules with the full set of permissions.
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
     * Seed common reference defaults. Currencies are global; taxes/units/payment
     * methods are scoped to the first company (skipped when none exists).
     */
    private function seedDefaults(): void
    {
        Currency::query()->firstOrCreate(
            ['code' => 'USD'],
            ['name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1, 'is_base' => true, 'status' => 'active'],
        );

        Currency::query()->firstOrCreate(
            ['code' => 'PHP'],
            ['name' => 'Philippine Peso', 'symbol' => '₱', 'exchange_rate' => 56, 'is_base' => false, 'status' => 'active'],
        );

        $company = Company::query()->first();

        if (! $company) {
            return;
        }

        $units = [
            ['name' => 'Piece', 'abbreviation' => 'pcs'],
            ['name' => 'Kilogram', 'abbreviation' => 'kg'],
            ['name' => 'Box', 'abbreviation' => 'box'],
        ];

        foreach ($units as $unit) {
            Unit::query()->firstOrCreate(
                ['company_id' => $company->id, 'name' => $unit['name']],
                ['abbreviation' => $unit['abbreviation'], 'conversion_factor' => 1],
            );
        }

        Tax::query()->firstOrCreate(
            ['company_id' => $company->id, 'name' => 'VAT'],
            ['rate' => 12, 'type' => 'both', 'is_inclusive' => false, 'status' => 'active'],
        );

        foreach (['Cash', 'Card'] as $method) {
            PaymentMethod::query()->firstOrCreate(
                ['company_id' => $company->id, 'name' => $method],
                ['type' => strtolower($method), 'is_active' => true],
            );
        }
    }

    /**
     * Reverse the registration: remove grants, navigations, modules and the seeded
     * default records for these codes.
     */
    public function down(): void
    {
        // Seeded reference defaults.
        Currency::query()->whereIn('code', ['USD', 'PHP'])->forceDelete();
        Unit::query()->whereIn('name', ['Piece', 'Kilogram', 'Box'])->forceDelete();
        Tax::query()->where('name', 'VAT')->forceDelete();
        PaymentMethod::query()->whereIn('name', ['Cash', 'Card'])->forceDelete();

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
