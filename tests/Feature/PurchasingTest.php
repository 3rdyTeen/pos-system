<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Company;
use App\Models\Module;
use App\Models\Navigation;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PurchasingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @var list<string>
     */
    private const PAGE_CODES = ['purchase_orders', 'purchase_returns'];

    private Company $company;

    private Branch $branch;

    private Warehouse $warehouse;

    private Supplier $supplier;

    private Product $product;

    private function scaffold(): void
    {
        $this->actingAs(User::factory()->create(['role_id' => Role::query()->first()?->id]));

        $this->company = Company::create(['name' => 'Acme']);
        $this->branch = Branch::create(['company_id' => $this->company->id, 'name' => 'Main']);
        $this->warehouse = Warehouse::create(['branch_id' => $this->branch->id, 'name' => 'Main WH', 'status' => 'active']);
        $this->supplier = Supplier::create(['company_id' => $this->company->id, 'name' => 'Metro', 'status' => 'active']);
        $this->product = Product::create([
            'company_id' => $this->company->id, 'name' => 'Coke', 'cost_price' => 1, 'selling_price' => 2, 'reorder_level' => 0,
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $details
     * @return array<string, mixed>
     */
    private function createOrder(array $details, string $status = 'ordered'): array
    {
        return $this->postJson('/api/purchase-orders', [
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'supplier_id' => $this->supplier->id,
            'status' => $status,
            'details' => $details,
        ])->assertCreated()->json('data');
    }

    /* Seeder */

    public function test_the_seeder_registers_purchasing_under_its_own_navigation_group(): void
    {
        $this->seed();

        $parent = Navigation::query()->where('code', 'purchasing')->first();
        $this->assertNotNull($parent);
        $this->assertNull($parent->parent_id);

        foreach (self::PAGE_CODES as $code) {
            $nav = Navigation::query()->where('code', $code)->first();
            $this->assertNotNull($nav, "Missing navigation entry for {$code}.");
            $this->assertSame($parent->id, $nav->parent_id);
        }
    }

    public function test_the_seeder_grants_every_role_access_to_purchasing(): void
    {
        $this->seed();

        $moduleIds = Module::query()->whereIn('code', ['purchasing', ...self::PAGE_CODES])->pluck('id');
        $this->assertCount(3, $moduleIds);

        foreach (Role::query()->get() as $role) {
            foreach ($moduleIds as $moduleId) {
                $this->assertTrue(
                    RoleModulePermission::query()->where('role_id', $role->id)->where('module_id', $moduleId)->exists(),
                    "Role {$role->name} has no permissions on module {$moduleId}."
                );
            }
        }
    }

    public function test_the_purchasing_pages_are_reachable(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'test@example.com')->firstOrFail());

        $this->get('/purchase-orders')->assertOk();
        $this->get('/purchase-returns')->assertOk();
    }

    /* Totals — the money columns are plain, so the service must compute them */

    public function test_line_and_header_totals_are_computed_from_the_lines(): void
    {
        $this->scaffold();

        $order = $this->createOrder([
            // 3 x 10.00 = 30.00, +2.50 tax, -1.00 discount => 31.50
            ['product_id' => $this->product->id, 'quantity' => '3', 'unit_cost' => '10.00', 'tax_amount' => '2.50', 'discount_amount' => '1.00'],
            // 2 x 5.25  = 10.50, no tax/discount            => 10.50
            ['product_id' => $this->product->id, 'quantity' => '2', 'unit_cost' => '5.25'],
        ]);

        $this->assertSame('31.50', $order['details'][0]['line_total']);
        $this->assertSame('10.50', $order['details'][1]['line_total']);

        $this->assertSame('40.50', $order['subtotal']);        // 30.00 + 10.50
        $this->assertSame('2.50', $order['tax_total']);
        $this->assertSame('1.00', $order['discount_total']);
        $this->assertSame('42.00', $order['grand_total']);     // 40.50 + 2.50 - 1.00
    }

    /** Totals must come from the lines, not from whatever the client claims. */
    public function test_client_supplied_totals_are_ignored(): void
    {
        $this->scaffold();

        $id = $this->postJson('/api/purchase-orders', [
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'supplier_id' => $this->supplier->id,
            'status' => 'draft',
            'grand_total' => '0.01',
            'subtotal' => '0.01',
            'details' => [['product_id' => $this->product->id, 'quantity' => '2', 'unit_cost' => '10.00']],
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('purchase_orders', ['id' => $id, 'grand_total' => '20.00', 'subtotal' => '20.00']);
    }

    public function test_totals_are_recomputed_when_the_lines_change(): void
    {
        $this->scaffold();
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '2', 'unit_cost' => '10.00']]);

        $this->putJson("/api/purchase-orders/{$order['id']}", [
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'supplier_id' => $this->supplier->id,
            'status' => 'ordered',
            'details' => [['product_id' => $this->product->id, 'quantity' => '1', 'unit_cost' => '3.00']],
        ])->assertOk()->assertJsonPath('data.grand_total', '3.00');
    }

    /** Omitting `details` must leave both the lines and the totals alone. */
    public function test_updating_without_details_keeps_the_lines_and_totals(): void
    {
        $this->scaffold();
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '2', 'unit_cost' => '10.00']]);

        $this->putJson("/api/purchase-orders/{$order['id']}", [
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'supplier_id' => $this->supplier->id,
            'status' => 'cancelled',
        ])->assertOk()->assertJsonPath('data.grand_total', '20.00');

        $this->assertSame(1, DB::table('purchase_details')->where('purchase_order_id', $order['id'])->count());
    }

    public function test_po_numbers_are_generated_and_increment(): void
    {
        $this->scaffold();

        $this->assertSame('PO-000001', $this->createOrder([])['po_number']);
        $this->assertSame('PO-000002', $this->createOrder([])['po_number']);
    }

    /* Receiving */

    public function test_receiving_part_of_an_order_marks_it_partially_received(): void
    {
        $this->scaffold();
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '10', 'unit_cost' => '1']]);

        $body = $this->postJson("/api/purchase-orders/{$order['id']}/receive", [
            'lines' => [['purchase_detail_id' => $order['details'][0]['id'], 'received_qty' => '4']],
        ])->assertOk()->json('data');

        $this->assertSame('partially_received', $body['status']);
        $this->assertSame('4.0000', $body['details'][0]['received_qty']);
    }

    public function test_receiving_every_line_in_full_marks_the_order_received(): void
    {
        $this->scaffold();
        $order = $this->createOrder([
            ['product_id' => $this->product->id, 'quantity' => '10', 'unit_cost' => '1'],
            ['product_id' => $this->product->id, 'quantity' => '5', 'unit_cost' => '1'],
        ]);

        $this->postJson("/api/purchase-orders/{$order['id']}/receive", [
            'lines' => [
                ['purchase_detail_id' => $order['details'][0]['id'], 'received_qty' => '10'],
                ['purchase_detail_id' => $order['details'][1]['id'], 'received_qty' => '5'],
            ],
        ])->assertOk()->assertJsonPath('data.status', 'received');
    }

    public function test_receiving_more_than_ordered_is_rejected(): void
    {
        $this->scaffold();
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '10', 'unit_cost' => '1']]);

        $this->postJson("/api/purchase-orders/{$order['id']}/receive", [
            'lines' => [['purchase_detail_id' => $order['details'][0]['id'], 'received_qty' => '11']],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.received_qty']);
    }

    public function test_a_draft_order_cannot_be_received(): void
    {
        $this->scaffold();
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '1', 'unit_cost' => '1']], 'draft');

        $this->postJson("/api/purchase-orders/{$order['id']}/receive", [
            'lines' => [['purchase_detail_id' => $order['details'][0]['id'], 'received_qty' => '1']],
        ])->assertStatus(422)->assertJsonValidationErrors(['status']);
    }

    /** A line from a different order must not be receivable against this one. */
    public function test_receiving_a_line_from_another_order_is_rejected(): void
    {
        $this->scaffold();
        $mine = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '1', 'unit_cost' => '1']]);
        $theirs = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '1', 'unit_cost' => '1']]);

        $this->postJson("/api/purchase-orders/{$mine['id']}/receive", [
            'lines' => [['purchase_detail_id' => $theirs['details'][0]['id'], 'received_qty' => '1']],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.purchase_detail_id']);
    }

    /* Payments */

    public function test_payments_are_recorded_and_reported_with_a_balance(): void
    {
        $this->scaffold();
        $method = PaymentMethod::create(['company_id' => $this->company->id, 'name' => 'Cash', 'is_active' => true]);
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '2', 'unit_cost' => '10.00']]);

        $this->postJson("/api/purchase-orders/{$order['id']}/payments", [
            'payment_method_id' => $method->id,
            'amount' => '12.00',
        ])->assertCreated();

        $body = $this->getJson("/api/purchase-orders/{$order['id']}")->assertOk()->json('data');

        $this->assertSame('12.00', $body['paid_total']);
        $this->assertSame('8.00', $body['balance']);
    }

    /**
     * SUM() over no payments is NULL, so an unpaid order must still report 0.00 paid
     * and a balance equal to its total rather than omitting the fields.
     */
    public function test_an_unpaid_order_reports_a_zero_paid_total_and_full_balance(): void
    {
        $this->scaffold();
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '2', 'unit_cost' => '10.00']]);

        // On create...
        $this->assertSame('0.00', $order['paid_total']);
        $this->assertSame('20.00', $order['balance']);

        // ...on show...
        $this->getJson("/api/purchase-orders/{$order['id']}")
            ->assertOk()
            ->assertJsonPath('data.paid_total', '0.00')
            ->assertJsonPath('data.balance', '20.00');

        // ...and in the list.
        $this->getJson('/api/purchase-orders')
            ->assertOk()
            ->assertJsonPath('data.0.paid_total', '0.00')
            ->assertJsonPath('data.0.balance', '20.00');
    }

    public function test_a_payment_beyond_the_outstanding_balance_is_rejected(): void
    {
        $this->scaffold();
        $method = PaymentMethod::create(['company_id' => $this->company->id, 'name' => 'Cash', 'is_active' => true]);
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '2', 'unit_cost' => '10.00']]);

        $this->postJson("/api/purchase-orders/{$order['id']}/payments", [
            'payment_method_id' => $method->id, 'amount' => '20.01',
        ])->assertStatus(422)->assertJsonValidationErrors(['amount']);
    }

    /* Returns */

    public function test_a_return_computes_its_line_and_total_amounts(): void
    {
        $this->scaffold();
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '5', 'unit_cost' => '4.00']]);

        $body = $this->postJson('/api/purchase-returns', [
            'purchase_order_id' => $order['id'],
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'reason' => 'Damaged',
            'details' => [[
                'purchase_detail_id' => $order['details'][0]['id'],
                'product_id' => $this->product->id,
                'quantity' => '2',
                'unit_cost' => '4.00',
            ]],
        ])->assertCreated()->json('data');

        $this->assertSame('PR-000001', $body['return_number']);
        $this->assertSame('8.00', $body['details'][0]['line_total']);
        $this->assertSame('8.00', $body['total_amount']);
    }

    /** A return line must reference a line of the order being returned against. */
    public function test_a_return_line_cannot_reference_another_orders_line(): void
    {
        $this->scaffold();
        $mine = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '1', 'unit_cost' => '1']]);
        $theirs = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '1', 'unit_cost' => '1']]);

        $this->postJson('/api/purchase-returns', [
            'purchase_order_id' => $mine['id'],
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'details' => [[
                'purchase_detail_id' => $theirs['details'][0]['id'],
                'product_id' => $this->product->id,
                'quantity' => '1',
                'unit_cost' => '1',
            ]],
        ])->assertStatus(422)->assertJsonValidationErrors(['details.0.purchase_detail_id']);
    }

    public function test_an_order_with_returns_against_it_cannot_be_deleted(): void
    {
        $this->scaffold();
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '1', 'unit_cost' => '1']]);

        $this->postJson('/api/purchase-returns', [
            'purchase_order_id' => $order['id'],
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'details' => [],
        ])->assertCreated();

        $this->deleteJson("/api/purchase-orders/{$order['id']}")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['purchase_order']);
    }

    public function test_deleting_an_order_removes_its_lines_and_payments(): void
    {
        $this->scaffold();
        $method = PaymentMethod::create(['company_id' => $this->company->id, 'name' => 'Cash', 'is_active' => true]);
        $order = $this->createOrder([['product_id' => $this->product->id, 'quantity' => '1', 'unit_cost' => '1']]);

        $this->postJson("/api/purchase-orders/{$order['id']}/payments", [
            'payment_method_id' => $method->id, 'amount' => '1.00',
        ])->assertCreated();

        $this->deleteJson("/api/purchase-orders/{$order['id']}")->assertOk();

        $this->assertDatabaseMissing('purchase_orders', ['id' => $order['id']]);
        $this->assertSame(0, DB::table('purchase_details')->where('purchase_order_id', $order['id'])->count());
        $this->assertSame(0, DB::table('purchase_payments')->where('purchase_order_id', $order['id'])->count());
    }

    public function test_orders_can_be_filtered_by_supplier_and_status(): void
    {
        $this->scaffold();
        $this->createOrder([], 'ordered');
        $this->createOrder([], 'draft');

        $this->getJson('/api/purchase-orders?status=draft')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/purchase-orders?supplier_id={$this->supplier->id}")->assertOk()->assertJsonCount(2, 'data');
        $this->assertSame(2, PurchaseOrder::query()->count());
    }
}
