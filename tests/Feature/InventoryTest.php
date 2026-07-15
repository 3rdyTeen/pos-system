<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Company;
use App\Models\Module;
use App\Models\Navigation;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @var list<string>
     */
    private const PAGE_CODES = ['warehouses', 'stock_balances', 'stock_adjustments', 'stock_transfers'];

    private function actingAsAdmin(): User
    {
        $this->actingAs(User::factory()->create(['role_id' => Role::query()->first()?->id]));

        return auth()->user();
    }

    private function branch(): Branch
    {
        $company = Company::create(['name' => 'Acme']);

        return Branch::create(['company_id' => $company->id, 'name' => 'Main']);
    }

    private function warehouse(?Branch $branch = null, string $name = 'Main WH'): Warehouse
    {
        return Warehouse::create(['branch_id' => ($branch ?? $this->branch())->id, 'name' => $name, 'status' => 'active']);
    }

    private function product(?Company $company = null): Product
    {
        $company ??= Company::create(['name' => 'Acme']);

        return Product::create([
            'company_id' => $company->id, 'name' => 'Coke', 'cost_price' => 1, 'selling_price' => 2, 'reorder_level' => 0,
        ]);
    }

    /* Migrations + seeder */

    /**
     * The Inventory data-migration creates the `inventory` module/nav when it runs
     * (migrations run before the seeder), and DatabaseSeeder also seeds `inventory`.
     * Both codes are unique, so a non-idempotent seeder would blow up here.
     */
    public function test_the_seeder_runs_cleanly_alongside_the_inventory_data_migration(): void
    {
        $this->seed();

        $this->assertSame(1, Module::query()->where('code', 'inventory')->count());
        $this->assertSame(1, Navigation::query()->where('code', 'inventory')->count());
    }

    public function test_the_seeder_registers_the_four_inventory_modules(): void
    {
        $this->seed();

        foreach (self::PAGE_CODES as $code) {
            $this->assertDatabaseHas('modules', ['code' => $code, 'is_enabled' => true]);
        }
    }

    public function test_the_inventory_pages_are_nested_under_the_inventory_navigation_node(): void
    {
        $this->seed();

        $parent = Navigation::query()->where('code', 'inventory')->firstOrFail();

        foreach (self::PAGE_CODES as $code) {
            $nav = Navigation::query()->where('code', $code)->first();

            $this->assertNotNull($nav, "Missing navigation entry for {$code}.");
            $this->assertSame($parent->id, $nav->parent_id, "{$code} should hang off the Inventory node.");
        }
    }

    public function test_the_seeder_grants_every_role_access_to_the_inventory_pages(): void
    {
        $this->seed();

        $moduleIds = Module::query()->whereIn('code', self::PAGE_CODES)->pluck('id');
        $this->assertCount(4, $moduleIds);

        foreach (Role::query()->get() as $role) {
            foreach ($moduleIds as $moduleId) {
                $this->assertTrue(
                    RoleModulePermission::query()->where('role_id', $role->id)->where('module_id', $moduleId)->exists(),
                    "Role {$role->name} has no permissions on module {$moduleId}."
                );
            }
        }
    }

    public function test_the_inventory_pages_are_reachable_through_the_module_access_gate(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'test@example.com')->firstOrFail());

        foreach (['/warehouses', '/stock-balances', '/stock-adjustments', '/stock-transfers'] as $url) {
            $this->get($url)->assertOk();
        }
    }

    /* Warehouses */

    public function test_warehouses_can_be_created_and_deleted(): void
    {
        $this->actingAsAdmin();
        $branch = $this->branch();

        $id = $this->postJson('/api/warehouses', [
            'branch_id' => $branch->id, 'name' => 'Main WH', 'code' => 'WH1', 'status' => 'active', 'is_default' => true,
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('warehouses', ['id' => $id, 'code' => 'WH1']);

        $this->deleteJson("/api/warehouses/{$id}")->assertOk();
        $this->assertDatabaseMissing('warehouses', ['id' => $id]);
    }

    public function test_flagging_a_warehouse_as_default_clears_the_previous_default_in_that_branch(): void
    {
        $this->actingAsAdmin();
        $branch = $this->branch();

        $first = $this->postJson('/api/warehouses', [
            'branch_id' => $branch->id, 'name' => 'A', 'status' => 'active', 'is_default' => true,
        ])->json('data.id');

        $second = $this->postJson('/api/warehouses', [
            'branch_id' => $branch->id, 'name' => 'B', 'status' => 'active', 'is_default' => true,
        ])->json('data.id');

        $this->assertDatabaseHas('warehouses', ['id' => $first, 'is_default' => false]);
        $this->assertDatabaseHas('warehouses', ['id' => $second, 'is_default' => true]);
        $this->assertSame(1, Warehouse::query()->where('branch_id', $branch->id)->where('is_default', true)->count());
    }

    /* Adjustments */

    public function test_an_adjustment_is_created_with_its_lines_and_an_auto_generated_number(): void
    {
        $this->actingAsAdmin();
        $warehouse = $this->warehouse();
        $product = $this->product();

        $body = $this->postJson('/api/stock-adjustments', [
            'warehouse_id' => $warehouse->id,
            'status' => 'draft',
            'reason' => 'Cycle count',
            'details' => [
                ['product_id' => $product->id, 'system_qty' => '10', 'counted_qty' => '8', 'unit_cost' => '1.50'],
            ],
        ])->assertCreated()->json('data');

        $this->assertSame('ADJ-000001', $body['adjustment_number']);
        $this->assertCount(1, $body['details']);
        // difference is a generated column: counted - system.
        $this->assertSame('-2.0000', $body['details'][0]['difference']);
    }

    public function test_adjustment_numbers_increment(): void
    {
        $this->actingAsAdmin();
        $warehouse = $this->warehouse();

        $payload = ['warehouse_id' => $warehouse->id, 'status' => 'draft', 'details' => []];

        $this->assertSame('ADJ-000001', $this->postJson('/api/stock-adjustments', $payload)->json('data.adjustment_number'));
        $this->assertSame('ADJ-000002', $this->postJson('/api/stock-adjustments', $payload)->json('data.adjustment_number'));
    }

    public function test_updating_an_adjustment_replaces_its_lines(): void
    {
        $this->actingAsAdmin();
        $warehouse = $this->warehouse();
        $product = $this->product();

        $id = $this->postJson('/api/stock-adjustments', [
            'warehouse_id' => $warehouse->id, 'status' => 'draft',
            'details' => [['product_id' => $product->id, 'system_qty' => '10', 'counted_qty' => '8', 'unit_cost' => '1']],
        ])->json('data.id');

        $this->putJson("/api/stock-adjustments/{$id}", [
            'warehouse_id' => $warehouse->id, 'status' => 'approved',
            'details' => [['product_id' => $product->id, 'system_qty' => '5', 'counted_qty' => '5', 'unit_cost' => '2']],
        ])->assertOk();

        $this->assertSame(1, DB::table('stock_adjustment_details')->where('stock_adjustment_id', $id)->count());
        $this->assertDatabaseHas('stock_adjustment_details', ['stock_adjustment_id' => $id, 'system_qty' => '5.0000']);
    }

    /** Omitting `details` entirely must leave the existing lines untouched. */
    public function test_updating_an_adjustment_without_details_keeps_its_lines(): void
    {
        $this->actingAsAdmin();
        $warehouse = $this->warehouse();
        $product = $this->product();

        $id = $this->postJson('/api/stock-adjustments', [
            'warehouse_id' => $warehouse->id, 'status' => 'draft',
            'details' => [['product_id' => $product->id, 'system_qty' => '10', 'counted_qty' => '8', 'unit_cost' => '1']],
        ])->json('data.id');

        $this->putJson("/api/stock-adjustments/{$id}", [
            'warehouse_id' => $warehouse->id, 'status' => 'approved',
        ])->assertOk();

        $this->assertSame(1, DB::table('stock_adjustment_details')->where('stock_adjustment_id', $id)->count());
    }

    public function test_deleting_an_adjustment_removes_its_lines(): void
    {
        $this->actingAsAdmin();
        $warehouse = $this->warehouse();
        $product = $this->product();

        $id = $this->postJson('/api/stock-adjustments', [
            'warehouse_id' => $warehouse->id, 'status' => 'draft',
            'details' => [['product_id' => $product->id, 'system_qty' => '1', 'counted_qty' => '1', 'unit_cost' => '1']],
        ])->json('data.id');

        $this->deleteJson("/api/stock-adjustments/{$id}")->assertOk();

        $this->assertDatabaseMissing('stock_adjustments', ['id' => $id]);
        $this->assertSame(0, DB::table('stock_adjustment_details')->where('stock_adjustment_id', $id)->count());
    }

    /* Transfers */

    public function test_a_transfer_cannot_move_stock_to_the_same_warehouse(): void
    {
        $this->actingAsAdmin();
        $warehouse = $this->warehouse();

        $this->postJson('/api/stock-transfers', [
            'from_warehouse_id' => $warehouse->id,
            'to_warehouse_id' => $warehouse->id,
            'status' => 'draft',
            'details' => [],
        ])->assertStatus(422)->assertJsonValidationErrors(['to_warehouse_id']);
    }

    public function test_a_transfer_is_created_with_lines_and_an_auto_generated_number(): void
    {
        $this->actingAsAdmin();
        $branch = $this->branch();
        $from = $this->warehouse($branch, 'From');
        $to = $this->warehouse($branch, 'To');
        $product = $this->product();

        $body = $this->postJson('/api/stock-transfers', [
            'from_warehouse_id' => $from->id,
            'to_warehouse_id' => $to->id,
            'status' => 'draft',
            'details' => [['product_id' => $product->id, 'quantity' => '5', 'unit_cost' => '1.25']],
        ])->assertCreated()->json('data');

        $this->assertSame('TRF-000001', $body['transfer_number']);
        $this->assertCount(1, $body['details']);
    }

    public function test_a_transfer_line_rejects_a_variant_belonging_to_another_product(): void
    {
        $this->actingAsAdmin();
        $branch = $this->branch();
        $from = $this->warehouse($branch, 'From');
        $to = $this->warehouse($branch, 'To');

        $product = $this->product();
        $other = $this->product();
        $foreignVariant = ProductVariant::create([
            'product_id' => $other->id, 'variant_name' => 'Theirs', 'cost_price' => 1, 'selling_price' => 1,
        ]);

        $this->postJson('/api/stock-transfers', [
            'from_warehouse_id' => $from->id,
            'to_warehouse_id' => $to->id,
            'status' => 'draft',
            'details' => [[
                'product_id' => $product->id,
                'product_variant_id' => $foreignVariant->id,
                'quantity' => '1',
                'unit_cost' => '1',
            ]],
        ])->assertStatus(422)->assertJsonValidationErrors(['details.0.product_variant_id']);
    }

    public function test_a_transfer_line_requires_a_positive_quantity(): void
    {
        $this->actingAsAdmin();
        $branch = $this->branch();
        $from = $this->warehouse($branch, 'From');
        $to = $this->warehouse($branch, 'To');
        $product = $this->product();

        $this->postJson('/api/stock-transfers', [
            'from_warehouse_id' => $from->id, 'to_warehouse_id' => $to->id, 'status' => 'draft',
            'details' => [['product_id' => $product->id, 'quantity' => '0', 'unit_cost' => '1']],
        ])->assertStatus(422)->assertJsonValidationErrors(['details.0.quantity']);
    }

    /* Balances (read-only) */

    public function test_balances_are_listed_read_only_with_the_generated_available_column(): void
    {
        $this->actingAsAdmin();
        $warehouse = $this->warehouse();
        $product = $this->product();

        DB::table('inventory_balances')->insert([
            'id' => (string) Str::uuid(),
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity_on_hand' => 10,
            'quantity_reserved' => 4,
            'average_cost' => 2,
        ]);

        $body = $this->getJson('/api/inventory-balances')->assertOk()->json('data');

        $this->assertCount(1, $body);
        $this->assertSame('6.0000', $body[0]['quantity_available']);
    }
}
