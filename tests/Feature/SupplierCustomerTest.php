<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\Module;
use App\Models\Navigation;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierCustomerTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $user = User::factory()->create(['role_id' => Role::query()->first()?->id]);
        $this->actingAs($user);

        return $user;
    }

    private function company(): Company
    {
        return Company::create(['name' => 'Acme']);
    }

    /* Migrations + seeder */

    public function test_the_seeder_registers_the_supplier_and_customer_modules(): void
    {
        $this->seed();

        $this->assertDatabaseHas('modules', ['code' => 'suppliers', 'is_enabled' => true]);
        $this->assertDatabaseHas('modules', ['code' => 'customers', 'is_enabled' => true]);
    }

    public function test_the_seeder_registers_them_as_two_top_level_navigation_entries(): void
    {
        $this->seed();

        foreach ([['suppliers', '/suppliers'], ['customers', '/customers']] as [$code, $url]) {
            $nav = Navigation::query()->where('code', $code)->first();

            $this->assertNotNull($nav, "Missing navigation entry for {$code}.");
            $this->assertNull($nav->parent_id, "{$code} should be top-level, not nested under a parent.");
            $this->assertSame($url, $nav->url);
        }
    }

    /**
     * The data-migration's own grant is a no-op on a fresh install (it runs before
     * any roles exist), so DatabaseSeeder has to grant these modules itself.
     */
    public function test_the_seeder_grants_every_role_access_to_the_new_modules(): void
    {
        $this->seed();

        $moduleIds = Module::query()->whereIn('code', ['suppliers', 'customers'])->pluck('id');
        $this->assertCount(2, $moduleIds);

        foreach (Role::query()->get() as $role) {
            foreach ($moduleIds as $moduleId) {
                $this->assertTrue(
                    RoleModulePermission::query()
                        ->where('role_id', $role->id)
                        ->where('module_id', $moduleId)
                        ->exists(),
                    "Role {$role->name} has no permissions on module {$moduleId}."
                );
            }
        }
    }

    public function test_the_pages_are_reachable_through_the_module_access_gate(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'test@example.com')->firstOrFail());

        $this->get('/suppliers')->assertOk();
        $this->get('/customers')->assertOk();
    }

    /* Suppliers */

    public function test_suppliers_can_be_created_listed_updated_and_deleted(): void
    {
        $this->actingAsAdmin();
        $company = $this->company();

        $id = $this->postJson('/api/suppliers', [
            'company_id' => $company->id,
            'name' => 'Metro Beverage',
            'contact_person' => 'Jane Cruz',
            'email' => 'sales@metro.test',
            'phone' => '123',
            'address' => 'Manila',
            'tax_id' => '001',
            'status' => 'active',
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('suppliers', ['id' => $id, 'name' => 'Metro Beverage']);

        $this->getJson('/api/suppliers')->assertOk()->assertJsonCount(1, 'data');

        $this->putJson("/api/suppliers/{$id}", [
            'company_id' => $company->id,
            'name' => 'Metro Beverage Inc.',
            'status' => 'inactive',
        ])->assertOk();

        $this->assertDatabaseHas('suppliers', ['id' => $id, 'name' => 'Metro Beverage Inc.', 'status' => 'inactive']);

        $this->deleteJson("/api/suppliers/{$id}")->assertOk();
        $this->assertDatabaseMissing('suppliers', ['id' => $id]);
    }

    public function test_a_supplier_requires_a_name_and_a_valid_status(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/suppliers', ['company_id' => $this->company()->id, 'status' => 'bogus'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'status']);
    }

    public function test_suppliers_can_be_searched_and_filtered_by_status(): void
    {
        $this->actingAsAdmin();
        $company = $this->company();

        Supplier::create(['company_id' => $company->id, 'name' => 'Alpha Foods', 'status' => 'active']);
        Supplier::create(['company_id' => $company->id, 'name' => 'Beta Drinks', 'status' => 'inactive']);

        $this->getJson('/api/suppliers?search=Alpha')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/suppliers?status=inactive')->assertOk()->assertJsonCount(1, 'data');
    }

    /* Customers */

    public function test_customers_can_be_created_listed_updated_and_deleted(): void
    {
        $this->actingAsAdmin();
        $company = $this->company();
        $group = CustomerGroup::create(['company_id' => $company->id, 'name' => 'VIP', 'discount_percentage' => '10']);

        $id = $this->postJson('/api/customers', [
            'company_id' => $company->id,
            'customer_group_id' => $group->id,
            'name' => 'Juan dela Cruz',
            'email' => 'juan@example.test',
            'credit_limit' => '500',
            'status' => 'active',
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('customers', ['id' => $id, 'customer_group_id' => $group->id]);

        $this->getJson('/api/customers')->assertOk()->assertJsonCount(1, 'data');

        $this->putJson("/api/customers/{$id}", [
            'company_id' => $company->id,
            'customer_group_id' => null,
            'name' => 'Juan D. Cruz',
            'credit_limit' => '750',
            'status' => 'active',
        ])->assertOk();

        $this->assertDatabaseHas('customers', ['id' => $id, 'name' => 'Juan D. Cruz', 'customer_group_id' => null]);

        $this->deleteJson("/api/customers/{$id}")->assertOk();
        $this->assertDatabaseMissing('customers', ['id' => $id]);
    }

    /**
     * customer_group_id is scoped to the submitted company, so a group belonging to
     * a different company must be rejected rather than silently attached.
     */
    public function test_a_customer_cannot_be_assigned_another_companys_group(): void
    {
        $this->actingAsAdmin();
        $acme = $this->company();
        $other = Company::create(['name' => 'Other Co']);
        $foreignGroup = CustomerGroup::create(['company_id' => $other->id, 'name' => 'Theirs', 'discount_percentage' => '5']);

        $this->postJson('/api/customers', [
            'company_id' => $acme->id,
            'customer_group_id' => $foreignGroup->id,
            'name' => 'Juan',
            'credit_limit' => '0',
            'status' => 'active',
        ])->assertStatus(422)->assertJsonValidationErrors(['customer_group_id']);
    }

    public function test_customers_can_be_filtered_by_group(): void
    {
        $this->actingAsAdmin();
        $company = $this->company();
        $vip = CustomerGroup::create(['company_id' => $company->id, 'name' => 'VIP', 'discount_percentage' => '10']);

        Customer::create(['company_id' => $company->id, 'customer_group_id' => $vip->id, 'name' => 'A', 'credit_limit' => '0', 'status' => 'active']);
        Customer::create(['company_id' => $company->id, 'name' => 'B', 'credit_limit' => '0', 'status' => 'active']);

        $this->getJson("/api/customers?customer_group_id={$vip->id}")->assertOk()->assertJsonCount(1, 'data');
    }

    /* Customer group options (no CRUD screen — this dropdown is the only reader) */

    public function test_customer_group_options_are_scoped_to_a_company(): void
    {
        $this->actingAsAdmin();
        $acme = $this->company();
        $other = Company::create(['name' => 'Other Co']);

        CustomerGroup::create(['company_id' => $acme->id, 'name' => 'Ours', 'discount_percentage' => '10']);
        CustomerGroup::create(['company_id' => $other->id, 'name' => 'Theirs', 'discount_percentage' => '5']);

        $this->getJson("/api/customer-groups/options?company_id={$acme->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Ours');

        $this->getJson('/api/customer-groups/options')->assertOk()->assertJsonCount(2, 'data');
    }
}
