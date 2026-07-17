<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ComboSlot;
use App\Models\ComboSlotOption;
use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\ModifierGroup;
use App\Models\ModifierOption;
use App\Models\Module;
use App\Models\Navigation;
use App\Models\PaymentMethod;
use App\Models\PosProfile;
use App\Models\Product;
use App\Models\Register;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\Tax;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\SettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PosTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @var list<string>
     */
    private const PAGE_CODES = ['pos_terminal', 'sales_history', 'sales_returns', 'pos_profiles'];

    private Company $company;

    private Branch $branch;

    private Warehouse $warehouse;

    private Register $register;

    private Product $product;

    private PaymentMethod $cash;

    private User $cashier;

    private function scaffold(): void
    {
        $this->cashier = User::factory()->create(['role_id' => Role::query()->first()?->id]);
        $this->actingAs($this->cashier);

        $this->company = Company::create(['name' => 'Acme']);
        $this->branch = Branch::create(['company_id' => $this->company->id, 'name' => 'Main']);
        $this->warehouse = Warehouse::create([
            'branch_id' => $this->branch->id, 'name' => 'Main WH', 'is_default' => true, 'status' => 'active',
        ]);
        $this->register = Register::create([
            'branch_id' => $this->branch->id, 'name' => 'Lane 1', 'status' => 'open',
        ]);
        $this->product = Product::create([
            'company_id' => $this->company->id, 'name' => 'Coke', 'cost_price' => 5, 'selling_price' => 10, 'reorder_level' => 0,
        ]);
        $this->cash = PaymentMethod::create([
            'company_id' => $this->company->id, 'name' => 'Cash', 'type' => 'cash', 'is_active' => true,
        ]);
    }

    /**
     * Put a known quantity of the scaffolded product on the shelf.
     */
    private function stock(float $quantity): void
    {
        InventoryBalance::query()->create([
            'warehouse_id' => $this->warehouse->id,
            'product_id' => $this->product->id,
            'quantity_on_hand' => $quantity,
            'quantity_reserved' => 0,
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $lines
     * @param  list<array<string, mixed>>  $payments
     * @return array<string, mixed>
     */
    private function sell(array $lines, array $payments = [], string $status = 'completed'): array
    {
        return $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'register_id' => $this->register->id,
            'status' => $status,
            'lines' => $lines,
            'payments' => $payments,
        ])->assertCreated()->json('data');
    }

    private function onHand(): float
    {
        return (float) InventoryBalance::query()
            ->where('warehouse_id', $this->warehouse->id)
            ->where('product_id', $this->product->id)
            ->value('quantity_on_hand');
    }

    /**
     * Turn feature controls on or off for the scaffolded company.
     *
     * @param  array<string, bool>  $flags
     */
    private function flags(array $flags): void
    {
        app(SettingService::class)->save($this->company->id, $flags);
    }

    /**
     * An "Add-ons" group on the scaffolded product: cheese (linked to a real product,
     * so it moves stock) and no-onions (price-only).
     *
     * @return array{0: ModifierGroup, 1: array<string, ModifierOption>}
     */
    private function addOns(): array
    {
        $cheese = Product::create([
            'company_id' => $this->company->id, 'name' => 'Cheese', 'cost_price' => 1, 'selling_price' => 3, 'reorder_level' => 0,
        ]);

        $group = ModifierGroup::create([
            'company_id' => $this->company->id, 'name' => 'Add-ons',
            'selection_type' => 'multiple', 'is_required' => false, 'status' => 'active',
        ]);

        $options = [
            'cheese' => ModifierOption::create([
                'modifier_group_id' => $group->id, 'name' => 'Extra cheese',
                'price_delta' => 3, 'product_id' => $cheese->id,
            ]),
            'no_onion' => ModifierOption::create([
                'modifier_group_id' => $group->id, 'name' => 'No onions', 'price_delta' => -2,
            ]),
        ];

        $this->product->modifierGroups()->attach($group->id, ['sort_order' => 0]);

        return [$group, $options];
    }

    /**
     * A required single-choice "Size" group on the scaffolded product.
     *
     * @return array<string, ModifierOption>
     */
    private function sizeGroup(bool $required): array
    {
        $group = ModifierGroup::create([
            'company_id' => $this->company->id, 'name' => 'Size',
            'selection_type' => 'single', 'is_required' => $required, 'status' => 'active',
        ]);

        $this->product->modifierGroups()->attach($group->id, ['sort_order' => 0]);

        return [
            'small' => ModifierOption::create(['modifier_group_id' => $group->id, 'name' => 'Small', 'price_delta' => 0]),
            'large' => ModifierOption::create(['modifier_group_id' => $group->id, 'name' => 'Large', 'price_delta' => 10]),
        ];
    }

    /**
     * A meal: the scaffolded product as a fixed burger, plus a swappable drink that
     * defaults to cola and costs 15 more as an iced tea.
     *
     * @return array{0: Product, 1: array<string, mixed>}
     */
    private function mealCombo(string $name = 'Burger meal'): array
    {
        $combo = Product::create([
            'company_id' => $this->company->id, 'name' => $name, 'cost_price' => 0,
            'selling_price' => 50, 'reorder_level' => 0, 'is_combo' => true,
        ]);

        $cola = Product::create([
            'company_id' => $this->company->id, 'name' => 'Cola', 'cost_price' => 2, 'selling_price' => 20, 'reorder_level' => 0,
        ]);
        $tea = Product::create([
            'company_id' => $this->company->id, 'name' => 'Iced tea', 'cost_price' => 3, 'selling_price' => 35, 'reorder_level' => 0,
        ]);

        $burgerSlot = ComboSlot::create([
            'product_id' => $combo->id, 'name' => 'Burger', 'quantity' => 1, 'is_swappable' => false, 'sort_order' => 0,
        ]);
        ComboSlotOption::create([
            'combo_slot_id' => $burgerSlot->id, 'product_id' => $this->product->id, 'price_delta' => 0, 'is_default' => true,
        ]);

        $drinkSlot = ComboSlot::create([
            'product_id' => $combo->id, 'name' => 'Drink', 'quantity' => 1, 'is_swappable' => true, 'sort_order' => 1,
        ]);

        return [$combo, [
            'burgerSlot' => $burgerSlot,
            'drinkSlot' => $drinkSlot,
            'cola' => ComboSlotOption::create([
                'combo_slot_id' => $drinkSlot->id, 'product_id' => $cola->id, 'price_delta' => 0, 'is_default' => true,
            ]),
            'tea' => ComboSlotOption::create([
                'combo_slot_id' => $drinkSlot->id, 'product_id' => $tea->id, 'price_delta' => 15, 'is_default' => false,
            ]),
        ]];
    }

    /* Seeder */

    public function test_the_seeder_registers_the_pos_pages_under_the_sales_group(): void
    {
        $this->seed();

        $parent = Navigation::query()->where('code', 'sales')->first();
        $this->assertNotNull($parent);
        $this->assertNull($parent->parent_id);

        foreach (self::PAGE_CODES as $code) {
            $nav = Navigation::query()->where('code', $code)->first();
            $this->assertNotNull($nav, "Missing navigation entry for {$code}.");
            $this->assertSame($parent->id, $nav->parent_id);
        }
    }

    public function test_the_seeder_grants_every_role_access_to_the_pos_pages(): void
    {
        $this->seed();

        $moduleIds = Module::query()->whereIn('code', self::PAGE_CODES)->pluck('id');
        $this->assertCount(4, $moduleIds);

        foreach (Role::query()->get() as $role) {
            foreach ($moduleIds as $moduleId) {
                $this->assertTrue(
                    RoleModulePermission::query()->where('role_id', $role->id)->where('module_id', $moduleId)->exists(),
                    'Every role should be granted the POS modules.',
                );
            }
        }
    }

    public function test_the_pos_pages_are_reachable(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'test@example.com')->firstOrFail());

        $this->get('/pos')->assertOk();
        $this->get('/sales-history')->assertOk();
        $this->get('/sales-returns')->assertOk();
        $this->get('/pos-profiles')->assertOk();
        $this->get('/feature-controls')->assertOk();
        $this->get('/modifier-groups')->assertOk();
    }

    public function test_the_seeder_registers_the_control_and_modifier_pages(): void
    {
        $this->seed();

        foreach ([['feature_controls', 'system_settings'], ['modifier_groups', 'catalog']] as [$code, $parentCode]) {
            $nav = Navigation::query()->where('code', $code)->first();
            $parent = Navigation::query()->where('code', $parentCode)->first();

            $this->assertNotNull($nav, "Missing navigation entry for {$code}.");
            $this->assertSame($parent?->id, $nav->parent_id, "{$code} should hang off {$parentCode}.");
        }
    }

    public function test_groups_can_be_attached_from_the_product_side(): void
    {
        $this->scaffold();
        [$group] = $this->addOns();

        // The product starts attached via the helper; detach it from this side.
        $this->putJson("/api/products/{$this->product->id}/modifier-groups", ['group_ids' => []])
            ->assertOk();

        $this->assertDatabaseCount('product_modifier_groups', 0);

        $attached = $this->putJson("/api/products/{$this->product->id}/modifier-groups", [
            'group_ids' => [$group->id],
        ])->assertOk()->json('data');

        $this->assertCount(1, $attached);
        $this->assertSame($group->id, $attached[0]['id']);
    }

    public function test_the_terminal_boots_on_a_fresh_install(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'test@example.com')->firstOrFail());

        // No register, no profile, no shift: the terminal must still answer rather
        // than error, or a new install could never make its first sale.
        $context = $this->getJson('/api/pos/context')->assertOk()->json('data');

        $this->assertNotNull($context['profile']);
        $this->assertSame('hybrid', $context['profile']['picking_mode']);
    }

    /* Totals */

    public function test_a_sale_computes_its_line_and_header_totals(): void
    {
        $this->scaffold();

        $sale = $this->sell([
            ['product_id' => $this->product->id, 'quantity' => 3],
        ]);

        // 3 x 10.00, no tax configured.
        $this->assertSame('30.00', $sale['details'][0]['line_total']);
        $this->assertSame('30.00', $sale['subtotal']);
        $this->assertSame('30.00', $sale['grand_total']);
    }

    public function test_the_catalogue_price_is_used_when_the_client_sends_none(): void
    {
        $this->scaffold();

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        $this->assertSame('10.00', $sale['details'][0]['unit_price']);
    }

    public function test_client_supplied_totals_are_ignored(): void
    {
        $this->scaffold();

        $sale = $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'grand_total' => 1,
            'subtotal' => 1,
            'tax_total' => 99,
            'lines' => [['product_id' => $this->product->id, 'quantity' => 2]],
            'payments' => [],
        ])->assertCreated()->json('data');

        $this->assertSame('20.00', $sale['grand_total']);
        $this->assertSame('0.00', $sale['tax_total']);
    }

    public function test_a_line_discount_reduces_the_total(): void
    {
        $this->scaffold();

        $sale = $this->sell([
            ['product_id' => $this->product->id, 'quantity' => 2, 'discount_amount' => 5],
        ]);

        // 2 x 10.00 - 5.00
        $this->assertSame('15.00', $sale['grand_total']);
        $this->assertSame('5.00', $sale['discount_total']);
        // subtotal stays gross of the discount.
        $this->assertSame('20.00', $sale['subtotal']);
    }

    public function test_a_discount_larger_than_the_line_is_rejected(): void
    {
        $this->scaffold();

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 1, 'discount_amount' => 999]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.discount_amount']);
    }

    /* Tax */

    public function test_tax_is_added_on_top_when_the_tax_is_exclusive(): void
    {
        $this->scaffold();

        $tax = Tax::create([
            'company_id' => $this->company->id, 'name' => 'VAT', 'rate' => 10,
            'type' => 'sales', 'is_inclusive' => false, 'status' => 'active',
        ]);
        $this->product->update(['tax_id' => $tax->id]);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        // 10.00 net + 10% on top.
        $this->assertSame('1.00', $sale['tax_total']);
        $this->assertSame('11.00', $sale['grand_total']);
    }

    public function test_tax_is_carved_out_when_the_tax_is_inclusive(): void
    {
        $this->scaffold();

        $tax = Tax::create([
            'company_id' => $this->company->id, 'name' => 'VAT', 'rate' => 10,
            'type' => 'sales', 'is_inclusive' => true, 'status' => 'active',
        ]);
        $this->product->update(['tax_id' => $tax->id]);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        // The shelf price stays 10.00; the tax is the portion already inside it.
        $this->assertSame('10.00', $sale['grand_total']);
        $this->assertSame('0.91', $sale['tax_total']);
    }

    public function test_a_purchase_only_tax_is_not_charged_on_a_sale(): void
    {
        $this->scaffold();

        $tax = Tax::create([
            'company_id' => $this->company->id, 'name' => 'Import duty', 'rate' => 25,
            'type' => 'purchase', 'is_inclusive' => false, 'status' => 'active',
        ]);
        $this->product->update(['tax_id' => $tax->id]);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        $this->assertSame('0.00', $sale['tax_total']);
        $this->assertSame('10.00', $sale['grand_total']);
    }

    public function test_the_tax_breakdown_records_the_rate_that_was_charged(): void
    {
        $this->scaffold();

        $tax = Tax::create([
            'company_id' => $this->company->id, 'name' => 'VAT', 'rate' => 10,
            'type' => 'both', 'is_inclusive' => false, 'status' => 'active',
        ]);
        $this->product->update(['tax_id' => $tax->id]);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        // Raising the rate later must not rewrite what this receipt says.
        $tax->update(['rate' => 25]);

        $this->assertDatabaseHas('sales_taxes', [
            'sale_id' => $sale['id'],
            'tax_name' => 'VAT',
            'rate' => '10.000',
            'tax_amount' => '1.00',
        ]);
    }

    /* Stock */

    public function test_completing_a_sale_deducts_stock_and_records_a_movement(): void
    {
        $this->scaffold();
        $this->stock(10);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 3]]);

        $this->assertSame(7.0, $this->onHand());
        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => 'sale',
            'reference_id' => $sale['id'],
            'movement_type' => 'sale',
            'quantity' => '-3.0000',
            'before_qty' => '10.0000',
            'after_qty' => '7.0000',
        ]);
    }

    public function test_holding_a_sale_does_not_move_stock(): void
    {
        $this->scaffold();
        $this->stock(10);

        $this->sell([['product_id' => $this->product->id, 'quantity' => 3]], status: 'held');

        $this->assertSame(10.0, $this->onHand());
        $this->assertDatabaseCount('stock_movements', 0);
    }

    public function test_the_sale_draws_from_the_branches_default_warehouse(): void
    {
        $this->scaffold();
        Warehouse::create(['branch_id' => $this->branch->id, 'name' => 'Overflow', 'is_default' => false, 'status' => 'active']);
        $this->stock(5);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        $this->assertSame($this->warehouse->id, $sale['warehouse_id']);
        $this->assertSame(4.0, $this->onHand());
    }

    public function test_overselling_is_rejected_when_the_profile_forbids_negative_stock(): void
    {
        $this->scaffold();
        $this->stock(2);

        $profile = PosProfile::create([
            'company_id' => $this->company->id, 'name' => 'Strict', 'picking_mode' => 'hybrid',
            'order_types' => ['retail'], 'allow_negative_stock' => false, 'status' => 'active',
        ]);
        $this->register->update(['pos_profile_id' => $profile->id]);

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'register_id' => $this->register->id,
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 5]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.quantity']);

        // The whole sale rolls back, so nothing was taken.
        $this->assertSame(2.0, $this->onHand());
        $this->assertDatabaseCount('sales', 0);
    }

    public function test_overselling_is_allowed_when_the_profile_permits_negative_stock(): void
    {
        $this->scaffold();
        $this->stock(2);

        $this->sell([['product_id' => $this->product->id, 'quantity' => 5]]);

        $this->assertSame(-3.0, $this->onHand());
    }

    public function test_the_ledger_always_sums_to_the_balance(): void
    {
        $this->scaffold();
        $this->stock(10);

        $this->sell([['product_id' => $this->product->id, 'quantity' => 3]]);
        $this->sell([['product_id' => $this->product->id, 'quantity' => 2]]);

        $ledger = (float) DB::table('stock_movements')
            ->where('product_id', $this->product->id)
            ->sum('quantity');

        // The opening 10 was not a movement, so the ledger accounts for the change only.
        $this->assertSame(-5.0, $ledger);
        $this->assertSame(5.0, $this->onHand());
    }

    /* Payments */

    public function test_a_fully_paid_sale_is_marked_paid(): void
    {
        $this->scaffold();

        $sale = $this->sell(
            [['product_id' => $this->product->id, 'quantity' => 2]],
            [['payment_method_id' => $this->cash->id, 'amount' => 20]],
        );

        $this->assertSame('paid', $sale['payment_status']);
        $this->assertSame('20.00', $sale['amount_paid']);
        $this->assertSame('0.00', $sale['amount_due']);
    }

    public function test_a_part_paid_sale_is_marked_partial(): void
    {
        $this->scaffold();

        $sale = $this->sell(
            [['product_id' => $this->product->id, 'quantity' => 2]],
            [['payment_method_id' => $this->cash->id, 'amount' => 12]],
        );

        $this->assertSame('partial', $sale['payment_status']);
        $this->assertSame('8.00', $sale['amount_due']);
    }

    public function test_paying_more_than_the_sale_is_rejected(): void
    {
        $this->scaffold();

        // A 500 note against a 20 sale is 480 of change, not 500 of takings.
        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 2]],
            'payments' => [['payment_method_id' => $this->cash->id, 'amount' => 500]],
        ])->assertStatus(422)->assertJsonValidationErrors(['payments']);
    }

    public function test_a_held_sale_cannot_carry_payments(): void
    {
        $this->scaffold();

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'held',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 1]],
            'payments' => [['payment_method_id' => $this->cash->id, 'amount' => 10]],
        ])->assertStatus(422)->assertJsonValidationErrors(['payments']);
    }

    /* Held orders */

    public function test_a_held_sale_can_be_resumed_and_completed(): void
    {
        $this->scaffold();
        $this->stock(10);

        $held = $this->sell([['product_id' => $this->product->id, 'quantity' => 2]], status: 'held');

        $completed = $this->postJson("/api/sales/{$held['id']}/complete", [
            'payments' => [['payment_method_id' => $this->cash->id, 'amount' => 20]],
        ])->assertOk()->json('data');

        $this->assertSame('completed', $completed['status']);
        $this->assertSame('paid', $completed['payment_status']);
        // Completing is what releases the stock.
        $this->assertSame(8.0, $this->onHand());
    }

    public function test_held_sales_are_listed_for_the_register(): void
    {
        $this->scaffold();

        $this->sell([['product_id' => $this->product->id, 'quantity' => 1]], status: 'held');
        $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        $held = $this->getJson("/api/sales/held?register_id={$this->register->id}")->assertOk()->json('data');

        $this->assertCount(1, $held);
        $this->assertSame('held', $held[0]['status']);
    }

    public function test_a_completed_sale_can_no_longer_be_edited(): void
    {
        $this->scaffold();

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        $this->putJson("/api/sales/{$sale['id']}", [
            'lines' => [['product_id' => $this->product->id, 'quantity' => 99]],
        ])->assertStatus(422)->assertJsonValidationErrors(['status']);
    }

    public function test_editing_a_held_sale_reprices_it(): void
    {
        $this->scaffold();

        $held = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]], status: 'held');

        $updated = $this->putJson("/api/sales/{$held['id']}", [
            'lines' => [['product_id' => $this->product->id, 'quantity' => 4]],
        ])->assertOk()->json('data');

        $this->assertSame('40.00', $updated['grand_total']);
    }

    /* Voiding */

    public function test_voiding_a_sale_returns_its_stock(): void
    {
        $this->scaffold();
        $this->stock(10);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 4]]);
        $this->assertSame(6.0, $this->onHand());

        $voided = $this->postJson("/api/sales/{$sale['id']}/void")->assertOk()->json('data');

        $this->assertSame('void', $voided['status']);
        $this->assertSame(10.0, $this->onHand());
        // The original movement survives; the reversal is a new row.
        $this->assertDatabaseHas('stock_movements', [
            'reference_id' => $sale['id'], 'movement_type' => 'return_in', 'quantity' => '4.0000',
        ]);
    }

    public function test_a_sale_cannot_be_voided_twice(): void
    {
        $this->scaffold();
        $this->stock(10);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 4]]);
        $this->postJson("/api/sales/{$sale['id']}/void")->assertOk();
        $this->postJson("/api/sales/{$sale['id']}/void")->assertStatus(422);

        // A second reversal would have put the stock back twice.
        $this->assertSame(10.0, $this->onHand());
    }

    public function test_a_held_sale_cannot_be_voided(): void
    {
        $this->scaffold();

        $held = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]], status: 'held');

        $this->postJson("/api/sales/{$held['id']}/void")->assertStatus(422)->assertJsonValidationErrors(['status']);
    }

    /* Returns */

    public function test_a_return_refunds_the_price_that_was_charged_and_restocks(): void
    {
        $this->scaffold();
        $this->stock(10);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 5]]);
        $this->assertSame(5.0, $this->onHand());

        // The shelf price changing must not change what the refund is worth.
        $this->product->update(['selling_price' => 99]);

        $return = $this->postJson('/api/sales-returns', [
            'sale_id' => $sale['id'],
            'status' => 'completed',
            'reason' => 'Damaged',
            'lines' => [['sales_detail_id' => $sale['details'][0]['id'], 'quantity' => 2]],
        ])->assertCreated()->json('data');

        $this->assertSame('20.00', $return['total_amount']);
        $this->assertSame(7.0, $this->onHand());
    }

    public function test_returning_more_than_was_sold_is_rejected(): void
    {
        $this->scaffold();

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 2]]);

        $this->postJson('/api/sales-returns', [
            'sale_id' => $sale['id'],
            'status' => 'completed',
            'lines' => [['sales_detail_id' => $sale['details'][0]['id'], 'quantity' => 3]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.quantity']);
    }

    public function test_a_line_cannot_be_returned_twice_over(): void
    {
        $this->scaffold();

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 2]]);
        $lineId = $sale['details'][0]['id'];

        $this->postJson('/api/sales-returns', [
            'sale_id' => $sale['id'], 'status' => 'completed',
            'lines' => [['sales_detail_id' => $lineId, 'quantity' => 2]],
        ])->assertCreated();

        $this->postJson('/api/sales-returns', [
            'sale_id' => $sale['id'], 'status' => 'completed',
            'lines' => [['sales_detail_id' => $lineId, 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.quantity']);
    }

    public function test_a_return_line_from_another_sale_is_rejected(): void
    {
        $this->scaffold();

        $first = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);
        $second = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        $this->postJson('/api/sales-returns', [
            'sale_id' => $second['id'], 'status' => 'completed',
            'lines' => [['sales_detail_id' => $first['details'][0]['id'], 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.sales_detail_id']);
    }

    public function test_a_held_sale_cannot_be_returned_against(): void
    {
        $this->scaffold();

        $held = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]], status: 'held');

        $this->postJson('/api/sales-returns', [
            'sale_id' => $held['id'], 'status' => 'completed',
            'lines' => [['sales_detail_id' => $held['details'][0]['id'], 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors(['sale_id']);
    }

    public function test_a_pending_return_does_not_restock_until_it_completes(): void
    {
        $this->scaffold();
        $this->stock(10);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 5]]);

        $this->postJson('/api/sales-returns', [
            'sale_id' => $sale['id'], 'status' => 'pending',
            'lines' => [['sales_detail_id' => $sale['details'][0]['id'], 'quantity' => 2]],
        ])->assertCreated();

        $this->assertSame(5.0, $this->onHand());
    }

    public function test_a_sale_with_returns_against_it_cannot_be_voided(): void
    {
        $this->scaffold();

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 2]]);

        $this->postJson('/api/sales-returns', [
            'sale_id' => $sale['id'], 'status' => 'completed',
            'lines' => [['sales_detail_id' => $sale['details'][0]['id'], 'quantity' => 1]],
        ])->assertCreated();

        $this->postJson("/api/sales/{$sale['id']}/void")->assertStatus(422)->assertJsonValidationErrors(['sale']);
    }

    /* Shifts */

    public function test_a_shift_opens_and_reports_its_takings(): void
    {
        $this->scaffold();

        $shift = $this->postJson('/api/shifts', [
            'register_id' => $this->register->id,
            'opening_balance' => 100,
        ])->assertCreated()->json('data');

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'register_id' => $this->register->id,
            'shift_id' => $shift['id'],
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 3]],
            'payments' => [['payment_method_id' => $this->cash->id, 'amount' => 30]],
        ])->assertCreated();

        $body = $this->getJson("/api/shifts/current?register_id={$this->register->id}")->assertOk()->json();

        // Cast: JSON renders 30.0 as 30, so it decodes back as an int.
        $this->assertSame(30.0, (float) $body['reconciliation']['cash_taken']);
        $this->assertSame(130.0, (float) $body['reconciliation']['expected_cash']);
        $this->assertSame(1, $body['reconciliation']['sales_count']);
    }

    public function test_a_register_cannot_have_two_open_shifts(): void
    {
        $this->scaffold();

        $this->postJson('/api/shifts', ['register_id' => $this->register->id, 'opening_balance' => 0])->assertCreated();

        $this->postJson('/api/shifts', ['register_id' => $this->register->id, 'opening_balance' => 0])
            ->assertStatus(422)->assertJsonValidationErrors(['register_id']);
    }

    public function test_closing_a_shift_reports_the_cash_variance(): void
    {
        $this->scaffold();

        $shift = $this->postJson('/api/shifts', [
            'register_id' => $this->register->id, 'opening_balance' => 100,
        ])->assertCreated()->json('data');

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'register_id' => $this->register->id,
            'shift_id' => $shift['id'],
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 2]],
            'payments' => [['payment_method_id' => $this->cash->id, 'amount' => 20]],
        ])->assertCreated();

        // Expected 120, counted 115 — the drawer is 5 short.
        $body = $this->postJson("/api/shifts/{$shift['id']}/close", ['closing_balance' => 115])
            ->assertOk()->json();

        $this->assertSame('closed', $body['data']['status']);
        $this->assertSame(120.0, (float) $body['reconciliation']['expected_cash']);
        $this->assertSame(-5.0, (float) $body['reconciliation']['variance']);
    }

    public function test_a_voided_sale_does_not_count_towards_the_drawer(): void
    {
        $this->scaffold();

        $shift = $this->postJson('/api/shifts', [
            'register_id' => $this->register->id, 'opening_balance' => 0,
        ])->assertCreated()->json('data');

        $sale = $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'register_id' => $this->register->id,
            'shift_id' => $shift['id'],
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 2]],
            'payments' => [['payment_method_id' => $this->cash->id, 'amount' => 20]],
        ])->assertCreated()->json('data');

        $this->postJson("/api/sales/{$sale['id']}/void")->assertOk();

        $body = $this->getJson("/api/shifts/current?register_id={$this->register->id}")->assertOk()->json();

        $this->assertSame(0.0, (float) $body['reconciliation']['cash_taken']);
    }

    public function test_a_closed_shift_cannot_be_closed_again(): void
    {
        $this->scaffold();

        $shift = $this->postJson('/api/shifts', [
            'register_id' => $this->register->id, 'opening_balance' => 0,
        ])->assertCreated()->json('data');

        $this->postJson("/api/shifts/{$shift['id']}/close", ['closing_balance' => 0])->assertOk();
        $this->postJson("/api/shifts/{$shift['id']}/close", ['closing_balance' => 0])->assertStatus(422);
    }

    /* Terminal configuration */

    public function test_an_unconfigured_register_still_gets_a_working_profile(): void
    {
        $this->scaffold();

        $context = $this->getJson("/api/pos/context?register_id={$this->register->id}")->assertOk()->json('data');

        $this->assertSame('hybrid', $context['profile']['picking_mode']);
        $this->assertSame(['retail'], $context['profile']['order_types']);
        $this->assertTrue($context['profile']['allow_negative_stock']);
    }

    public function test_the_registers_own_profile_drives_the_terminal(): void
    {
        $this->scaffold();

        $profile = PosProfile::create([
            'company_id' => $this->company->id, 'name' => 'Fast food', 'picking_mode' => 'tiles',
            'order_types' => ['dine_in', 'takeout'], 'default_order_type' => 'dine_in',
            'quick_tender' => [50, 100], 'status' => 'active',
        ]);
        $this->register->update(['pos_profile_id' => $profile->id]);

        $context = $this->getJson("/api/pos/context?register_id={$this->register->id}")->assertOk()->json('data');

        $this->assertSame('tiles', $context['profile']['picking_mode']);
        $this->assertSame(['dine_in', 'takeout'], $context['profile']['order_types']);
        $this->assertSame('dine_in', $context['profile']['default_order_type']);
    }

    public function test_a_register_without_a_profile_falls_back_to_the_company_default(): void
    {
        $this->scaffold();

        PosProfile::create([
            'company_id' => $this->company->id, 'name' => 'Grocery', 'picking_mode' => 'barcode',
            'order_types' => ['retail'], 'is_default' => true, 'status' => 'active',
        ]);

        $context = $this->getJson("/api/pos/context?register_id={$this->register->id}")->assertOk()->json('data');

        $this->assertSame('barcode', $context['profile']['picking_mode']);
    }

    public function test_the_context_reports_the_warehouse_the_sale_will_draw_from(): void
    {
        $this->scaffold();

        $context = $this->getJson("/api/pos/context?register_id={$this->register->id}")->assertOk()->json('data');

        // Must agree with what SaleService actually deducts from, or the terminal
        // would show stock from one warehouse and take it from another.
        $this->assertSame($this->warehouse->id, $context['warehouse_id']);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);
        $this->assertSame($context['warehouse_id'], $sale['warehouse_id']);
    }

    public function test_the_product_grid_reports_stock_for_the_named_warehouse(): void
    {
        $this->scaffold();
        $this->stock(7);

        $products = $this->getJson("/api/pos/products?warehouse_id={$this->warehouse->id}")->assertOk()->json('data');

        $this->assertSame('7', $products[0]['stock_on_hand']);
    }

    public function test_the_product_grid_reports_no_stock_when_no_warehouse_is_named(): void
    {
        $this->scaffold();
        $this->stock(7);

        $products = $this->getJson('/api/pos/products')->assertOk()->json('data');

        // Null rather than 0: "not counted" and "none left" are different answers.
        $this->assertNull($products[0]['stock_on_hand']);
    }

    public function test_an_order_type_outside_the_profile_is_still_recorded_on_the_sale(): void
    {
        $this->scaffold();

        $sale = $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'order_type' => 'takeout',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 1]],
        ])->assertCreated()->json('data');

        $this->assertSame('takeout', $sale['order_type']);
    }

    /* Feature controls */

    public function test_flags_fall_back_to_their_defaults_when_nothing_is_saved(): void
    {
        $this->scaffold();

        $flags = app(SettingService::class)->all($this->company->id);

        // Conservative by default: a plain retail shop should not be asked which
        // size of drink the customer wants.
        $this->assertFalse($flags['modifiers.enabled']);
        $this->assertFalse($flags['combos.enabled']);
        $this->assertTrue($flags['sales.allow_price_override']);
    }

    public function test_flags_can_be_saved_and_read_back(): void
    {
        $this->scaffold();

        $this->putJson('/api/feature-controls', [
            'company_id' => $this->company->id,
            'flags' => ['modifiers.enabled' => true, 'sales.allow_price_override' => false],
        ])->assertOk();

        $flags = app(SettingService::class)->all($this->company->id);
        $this->assertTrue($flags['modifiers.enabled']);
        $this->assertFalse($flags['sales.allow_price_override']);
    }

    public function test_an_unknown_flag_is_not_stored(): void
    {
        $this->scaffold();

        $this->putJson('/api/feature-controls', [
            'company_id' => $this->company->id,
            'flags' => ['modifiers.enabled' => true, 'pwn' => true],
        ])->assertOk();

        // The settings table is not a dumping ground for arbitrary keys.
        $this->assertDatabaseMissing('settings', ['setting_key' => 'pwn']);
    }

    public function test_a_price_override_is_rejected_when_the_control_is_off(): void
    {
        $this->scaffold();
        $this->flags(['sales.allow_price_override' => false]);

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 1, 'unit_price' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.unit_price']);
    }

    public function test_a_line_discount_is_rejected_when_the_control_is_off(): void
    {
        $this->scaffold();
        $this->flags(['sales.allow_line_discount' => false]);

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 1, 'discount_amount' => 5]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.discount_amount']);
    }

    /* Modifiers */

    public function test_a_modifier_adds_its_price_to_the_line(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        [, $options] = $this->addOns();

        $sale = $this->sell([[
            'product_id' => $this->product->id,
            'quantity' => 2,
            'modifiers' => [$options['cheese']->id],
        ]]);

        // (10.00 base + 3.00 cheese) x 2
        $this->assertSame('13.00', $sale['details'][0]['unit_price']);
        $this->assertSame('26.00', $sale['grand_total']);
    }

    public function test_a_negative_modifier_reduces_the_line(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        [, $options] = $this->addOns();

        $sale = $this->sell([[
            'product_id' => $this->product->id,
            'quantity' => 1,
            'modifiers' => [$options['no_onion']->id],
        ]]);

        $this->assertSame('8.00', $sale['grand_total']);
    }

    public function test_a_modifier_records_the_name_and_price_that_were_charged(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        [, $options] = $this->addOns();

        $sale = $this->sell([[
            'product_id' => $this->product->id, 'quantity' => 1, 'modifiers' => [$options['cheese']->id],
        ]]);

        // Repricing tomorrow must not rewrite today's receipt.
        $options['cheese']->update(['name' => 'Cheese slice', 'price_delta' => 99]);

        $this->assertDatabaseHas('sales_detail_modifiers', [
            'sales_detail_id' => $sale['details'][0]['id'],
            'name' => 'Extra cheese',
            'price_delta' => '3.00',
        ]);
    }

    public function test_a_modifier_from_another_product_is_rejected(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        [, $options] = $this->addOns();

        $other = Product::create([
            'company_id' => $this->company->id, 'name' => 'Fries', 'cost_price' => 1, 'selling_price' => 5, 'reorder_level' => 0,
        ]);

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $other->id, 'quantity' => 1, 'modifiers' => [$options['cheese']->id]]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.modifiers']);
    }

    public function test_a_required_group_must_be_answered(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        $this->sizeGroup(required: true);

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.modifiers']);
    }

    public function test_a_single_choice_group_rejects_two_answers(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        $options = $this->sizeGroup(required: true);

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [[
                'product_id' => $this->product->id, 'quantity' => 1,
                'modifiers' => [$options['small']->id, $options['large']->id],
            ]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.modifiers']);
    }

    public function test_deactivating_a_required_group_does_not_strand_the_product(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        $options = $this->sizeGroup(required: true);

        $options['small']->group->update(['status' => 'inactive']);

        // The terminal stops offering an inactive group, so the sale must stop
        // demanding it — otherwise the item could never be sold again.
        $config = $this->getJson("/api/pos/products/{$this->product->id}/configuration")->assertOk()->json('data');
        $this->assertCount(0, $config['groups']);

        $sale = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);
        $this->assertSame('10.00', $sale['grand_total']);
    }

    public function test_an_inactive_groups_option_cannot_be_chosen(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        $options = $this->sizeGroup(required: false);

        $options['large']->group->update(['status' => 'inactive']);

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 1, 'modifiers' => [$options['large']->id]]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.modifiers']);
    }

    public function test_a_modifier_linked_to_a_product_deducts_its_stock(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        [, $options] = $this->addOns();
        $this->stock(10);

        $cheeseStock = InventoryBalance::create([
            'warehouse_id' => $this->warehouse->id,
            'product_id' => $options['cheese']->product_id,
            'quantity_on_hand' => 20,
            'quantity_reserved' => 0,
        ]);

        $this->sell([[
            'product_id' => $this->product->id, 'quantity' => 3, 'modifiers' => [$options['cheese']->id],
        ]]);

        // Three burgers, three slices of cheese.
        $this->assertSame(7.0, $this->onHand());
        $this->assertSame(17.0, (float) $cheeseStock->fresh()->quantity_on_hand);
    }

    public function test_a_modifier_with_no_product_moves_no_stock(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        [, $options] = $this->addOns();
        $this->stock(10);

        $this->sell([[
            'product_id' => $this->product->id, 'quantity' => 1, 'modifiers' => [$options['no_onion']->id],
        ]]);

        // "No onions" is a note with a price, not a thing to deduct.
        $this->assertDatabaseCount('stock_movements', 1);
    }

    public function test_modifiers_are_rejected_when_the_control_is_off(): void
    {
        $this->scaffold();
        [, $options] = $this->addOns();

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $this->product->id, 'quantity' => 1, 'modifiers' => [$options['cheese']->id]]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.modifiers']);
    }

    /* Combos */

    public function test_a_combo_prices_its_base_plus_any_swap_surcharge(): void
    {
        $this->scaffold();
        $this->flags(['combos.enabled' => true]);
        [$combo, $slots] = $this->mealCombo();

        $sale = $this->sell([[
            'product_id' => $combo->id,
            'quantity' => 1,
            'components' => [['combo_slot_option_id' => $slots['tea']->id]],
        ]]);

        // 50.00 meal + 15.00 to swap the cola for an iced tea.
        $this->assertSame('65.00', $sale['grand_total']);
    }

    public function test_a_combo_falls_back_to_its_default_component(): void
    {
        $this->scaffold();
        $this->flags(['combos.enabled' => true]);
        [$combo] = $this->mealCombo();

        $sale = $this->sell([['product_id' => $combo->id, 'quantity' => 1]]);

        $this->assertSame('50.00', $sale['grand_total']);
        $this->assertDatabaseHas('sales_detail_components', [
            'sales_detail_id' => $sale['details'][0]['id'],
            'name' => 'Cola',
        ]);
    }

    public function test_a_combo_deducts_its_components_and_not_itself(): void
    {
        $this->scaffold();
        $this->flags(['combos.enabled' => true]);
        [$combo, $slots] = $this->mealCombo();

        $burgerStock = InventoryBalance::create([
            'warehouse_id' => $this->warehouse->id, 'product_id' => $this->product->id,
            'quantity_on_hand' => 10, 'quantity_reserved' => 0,
        ]);
        $colaStock = InventoryBalance::create([
            'warehouse_id' => $this->warehouse->id, 'product_id' => $slots['cola']->product_id,
            'quantity_on_hand' => 10, 'quantity_reserved' => 0,
        ]);

        $this->sell([['product_id' => $combo->id, 'quantity' => 2]]);

        $this->assertSame(8.0, (float) $burgerStock->fresh()->quantity_on_hand);
        $this->assertSame(8.0, (float) $colaStock->fresh()->quantity_on_hand);

        // The combo itself is a price and a name; it has no stock to take.
        $this->assertDatabaseMissing('stock_movements', ['product_id' => $combo->id]);
    }

    public function test_a_combo_slot_quantity_multiplies_by_the_line_quantity(): void
    {
        $this->scaffold();
        $this->flags(['combos.enabled' => true]);
        [$combo, $slots] = $this->mealCombo();

        // Two pieces of chicken per meal.
        $slots['burgerSlot']->update(['quantity' => 2]);

        $burgerStock = InventoryBalance::create([
            'warehouse_id' => $this->warehouse->id, 'product_id' => $this->product->id,
            'quantity_on_hand' => 20, 'quantity_reserved' => 0,
        ]);

        $this->sell([['product_id' => $combo->id, 'quantity' => 3]]);

        // 2 per meal x 3 meals.
        $this->assertSame(14.0, (float) $burgerStock->fresh()->quantity_on_hand);
    }

    public function test_a_component_from_another_combo_is_rejected(): void
    {
        $this->scaffold();
        $this->flags(['combos.enabled' => true]);
        [$combo] = $this->mealCombo();
        [, $otherSlots] = $this->mealCombo('Second meal');

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [[
                'product_id' => $combo->id, 'quantity' => 1,
                'components' => [['combo_slot_option_id' => $otherSlots['tea']->id]],
            ]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.components']);
    }

    public function test_a_fixed_slot_cannot_be_swapped(): void
    {
        $this->scaffold();
        $this->flags(['combos.enabled' => true]);
        [$combo, $slots] = $this->mealCombo();

        $slots['drinkSlot']->update(['is_swappable' => false]);

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [[
                'product_id' => $combo->id, 'quantity' => 1,
                'components' => [['combo_slot_option_id' => $slots['tea']->id]],
            ]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.components']);
    }

    public function test_a_combo_with_no_slots_cannot_be_sold(): void
    {
        $this->scaffold();
        $this->flags(['combos.enabled' => true]);

        $empty = Product::create([
            'company_id' => $this->company->id, 'name' => 'Empty meal', 'cost_price' => 0,
            'selling_price' => 50, 'reorder_level' => 0, 'is_combo' => true,
        ]);

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $empty->id, 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.product_id']);
    }

    public function test_components_on_a_non_combo_are_rejected(): void
    {
        $this->scaffold();
        $this->flags(['combos.enabled' => true]);
        [, $slots] = $this->mealCombo();

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [[
                'product_id' => $this->product->id, 'quantity' => 1,
                'components' => [['combo_slot_option_id' => $slots['tea']->id]],
            ]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.components']);
    }

    public function test_a_combo_is_rejected_when_the_control_is_off(): void
    {
        $this->scaffold();
        [$combo] = $this->mealCombo();

        $this->postJson('/api/sales', [
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'lines' => [['product_id' => $combo->id, 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors(['lines.0.product_id']);
    }

    public function test_a_voided_combo_returns_its_components(): void
    {
        $this->scaffold();
        $this->flags(['combos.enabled' => true]);
        [$combo, $slots] = $this->mealCombo();

        $colaStock = InventoryBalance::create([
            'warehouse_id' => $this->warehouse->id, 'product_id' => $slots['cola']->product_id,
            'quantity_on_hand' => 10, 'quantity_reserved' => 0,
        ]);

        $sale = $this->sell([['product_id' => $combo->id, 'quantity' => 2]]);
        $this->assertSame(8.0, (float) $colaStock->fresh()->quantity_on_hand);

        $this->postJson("/api/sales/{$sale['id']}/void")->assertOk();

        $this->assertSame(10.0, (float) $colaStock->fresh()->quantity_on_hand);
    }

    /* Configuration endpoints */

    public function test_the_terminal_flags_which_products_need_configuring(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true, 'combos.enabled' => true]);
        $this->addOns();
        [$combo] = $this->mealCombo();

        $plain = Product::create([
            'company_id' => $this->company->id, 'name' => 'Water', 'cost_price' => 1, 'selling_price' => 2, 'reorder_level' => 0,
        ]);

        $products = collect($this->getJson('/api/pos/products')->assertOk()->json('data'))->keyBy('id');

        $this->assertTrue($products[$this->product->id]['needs_configuration'], 'A product with groups needs the dialog.');
        $this->assertTrue($products[$combo->id]['needs_configuration'], 'A combo needs the dialog.');
        $this->assertFalse($products[$plain->id]['needs_configuration'], 'A plain product should go straight into the cart.');
    }

    public function test_the_terminal_does_not_flag_configuration_when_the_controls_are_off(): void
    {
        $this->scaffold();
        // Controls left at their defaults: modifiers and combos both off.
        $this->addOns();
        [$combo] = $this->mealCombo();

        $products = collect($this->getJson('/api/pos/products')->assertOk()->json('data'))->keyBy('id');

        // A product still has its groups, and a combo still has its slots, but with the
        // capability off tapping them must not open a configurator the sale would empty.
        $this->assertFalse($products[$this->product->id]['needs_configuration'], 'Modifiers off: no dialog.');
        $this->assertFalse($products[$combo->id]['needs_configuration'], 'Combos off: no dialog.');
    }

    public function test_the_lookup_gates_configuration_on_the_controls_too(): void
    {
        $this->scaffold();
        $this->addOns();
        $this->product->barcodes()->create(['barcode' => '555']);

        // Off by default: a scanned product with groups goes straight to the cart.
        $off = $this->getJson('/api/pos/lookup?barcode=555')->assertOk()->json('data');
        $this->assertFalse($off['needs_configuration']);

        $this->flags(['modifiers.enabled' => true]);

        $on = $this->getJson('/api/pos/lookup?barcode=555')->assertOk()->json('data');
        $this->assertTrue($on['needs_configuration']);
    }

    public function test_the_context_reports_the_capability_flags_for_the_terminal(): void
    {
        $this->scaffold();

        $flags = $this->getJson("/api/pos/context?register_id={$this->register->id}")->assertOk()->json('data.flags');

        // The terminal-facing shape: snake_case keys, not the dotted storage keys.
        $this->assertSame(
            ['modifiers_enabled', 'combos_enabled', 'allow_price_override', 'allow_line_discount', 'show_stock'],
            array_keys($flags),
        );
        // Defaults are retail-conservative: food-service features off, terminal aids on.
        $this->assertFalse($flags['modifiers_enabled']);
        $this->assertTrue($flags['allow_price_override']);
        $this->assertTrue($flags['show_stock']);

        $this->flags(['modifiers.enabled' => true, 'terminal.show_stock' => false]);

        $updated = $this->getJson("/api/pos/context?register_id={$this->register->id}")->assertOk()->json('data.flags');
        $this->assertTrue($updated['modifiers_enabled']);
        $this->assertFalse($updated['show_stock']);
    }

    public function test_the_configuration_endpoint_returns_the_groups_and_slots(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true, 'combos.enabled' => true]);
        [$combo] = $this->mealCombo();

        $config = $this->getJson("/api/pos/products/{$combo->id}/configuration")->assertOk()->json('data');

        $this->assertTrue($config['is_combo']);
        $this->assertCount(2, $config['slots']);
        $this->assertSame('Drink', $config['slots'][1]['name']);
        $this->assertCount(2, $config['slots'][1]['options']);
    }

    public function test_the_configuration_endpoint_hides_groups_when_the_control_is_off(): void
    {
        $this->scaffold();
        $this->addOns();

        $config = $this->getJson("/api/pos/products/{$this->product->id}/configuration")->assertOk()->json('data');

        // The dialog must not offer what the sale would then reject.
        $this->assertCount(0, $config['groups']);
    }

    public function test_the_configuration_endpoint_reports_the_bounds_the_server_enforces(): void
    {
        $this->scaffold();
        $this->flags(['modifiers.enabled' => true]);
        $this->sizeGroup(required: true);

        $config = $this->getJson("/api/pos/products/{$this->product->id}/configuration")->assertOk()->json('data');

        // A required single group means exactly one, whatever min/max say.
        $this->assertSame(1, $config['groups'][0]['min_select']);
        $this->assertSame(1, $config['groups'][0]['max_select']);
    }

    /* Modifier group management */

    public function test_a_modifier_group_is_created_with_its_options_and_products(): void
    {
        $this->scaffold();

        $group = $this->postJson('/api/modifier-groups', [
            'company_id' => $this->company->id,
            'name' => 'Sugar level',
            'selection_type' => 'single',
            'is_required' => true,
            'status' => 'active',
            'options' => [
                ['name' => '0%', 'price_delta' => 0],
                ['name' => '100%', 'price_delta' => 5],
            ],
            'product_ids' => [$this->product->id],
        ])->assertCreated()->json('data');

        $this->assertCount(2, $group['options']);
        $this->assertSame([$this->product->id], $group['product_ids']);
    }

    public function test_editing_a_group_keeps_option_ids_stable(): void
    {
        $this->scaffold();
        [$group, $options] = $this->addOns();

        $this->putJson("/api/modifier-groups/{$group->id}", [
            'name' => 'Extras',
            'selection_type' => 'multiple',
            'status' => 'active',
            'options' => [
                ['id' => $options['cheese']->id, 'name' => 'Extra cheese', 'price_delta' => 4],
                ['name' => 'Bacon', 'price_delta' => 6],
            ],
        ])->assertOk();

        // Renaming the group must not orphan the sales that point at its options.
        $this->assertDatabaseHas('modifier_options', ['id' => $options['cheese']->id, 'price_delta' => '4.00']);
        // The option dropped from the list goes.
        $this->assertDatabaseMissing('modifier_options', ['id' => $options['no_onion']->id]);
    }

    public function test_combo_slots_are_saved_for_a_combo_product(): void
    {
        $this->scaffold();

        $combo = Product::create([
            'company_id' => $this->company->id, 'name' => 'Meal', 'cost_price' => 0,
            'selling_price' => 50, 'reorder_level' => 0, 'is_combo' => true,
        ]);

        $slots = $this->putJson("/api/products/{$combo->id}/combo-slots", [
            'slots' => [[
                'name' => 'Main',
                'quantity' => 1,
                'is_swappable' => false,
                'options' => [['product_id' => $this->product->id, 'price_delta' => 0, 'is_default' => true]],
            ]],
        ])->assertOk()->json('data');

        $this->assertCount(1, $slots);
        $this->assertSame('Main', $slots[0]['name']);
    }

    public function test_a_slot_gets_a_default_even_when_none_is_named(): void
    {
        $this->scaffold();

        $combo = Product::create([
            'company_id' => $this->company->id, 'name' => 'Meal', 'cost_price' => 0,
            'selling_price' => 50, 'reorder_level' => 0, 'is_combo' => true,
        ]);

        $slots = $this->putJson("/api/products/{$combo->id}/combo-slots", [
            'slots' => [[
                'name' => 'Main',
                'quantity' => 1,
                // No is_default anywhere: an unanswered slot would resolve to nothing.
                'options' => [['product_id' => $this->product->id, 'price_delta' => 0]],
            ]],
        ])->assertOk()->json('data');

        $this->assertTrue($slots[0]['options'][0]['is_default']);
    }

    public function test_a_combo_cannot_contain_itself(): void
    {
        $this->scaffold();

        $combo = Product::create([
            'company_id' => $this->company->id, 'name' => 'Meal', 'cost_price' => 0,
            'selling_price' => 50, 'reorder_level' => 0, 'is_combo' => true,
        ]);

        $this->putJson("/api/products/{$combo->id}/combo-slots", [
            'slots' => [[
                'name' => 'Main', 'quantity' => 1,
                'options' => [['product_id' => $combo->id, 'price_delta' => 0]],
            ]],
        ])->assertStatus(422)->assertJsonValidationErrors(['slots.0.options.0.product_id']);
    }

    public function test_a_combo_cannot_nest_another_combo(): void
    {
        $this->scaffold();
        [$inner] = $this->mealCombo();

        $outer = Product::create([
            'company_id' => $this->company->id, 'name' => 'Family bundle', 'cost_price' => 0,
            'selling_price' => 200, 'reorder_level' => 0, 'is_combo' => true,
        ]);

        // Nesting would recurse forever when the sale is priced and its stock posted.
        $this->putJson("/api/products/{$outer->id}/combo-slots", [
            'slots' => [[
                'name' => 'Meal', 'quantity' => 1,
                'options' => [['product_id' => $inner->id, 'price_delta' => 0]],
            ]],
        ])->assertStatus(422)->assertJsonValidationErrors(['slots.0.options.0.product_id']);
    }

    public function test_slots_cannot_be_given_to_a_non_combo(): void
    {
        $this->scaffold();

        $this->putJson("/api/products/{$this->product->id}/combo-slots", [
            'slots' => [[
                'name' => 'Main', 'quantity' => 1,
                'options' => [['product_id' => $this->product->id, 'price_delta' => 0]],
            ]],
        ])->assertStatus(422)->assertJsonValidationErrors(['product']);
    }

    /* Filtering */

    public function test_sales_can_be_filtered_by_status(): void
    {
        $this->scaffold();

        $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);
        $this->sell([['product_id' => $this->product->id, 'quantity' => 1]], status: 'held');

        $completed = $this->getJson('/api/sales?status=completed')->assertOk()->json('data');
        $this->assertCount(1, $completed);
        $this->assertSame('completed', $completed[0]['status']);
    }

    public function test_sale_numbers_increment(): void
    {
        $this->scaffold();

        $first = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);
        $second = $this->sell([['product_id' => $this->product->id, 'quantity' => 1]]);

        $this->assertSame('SL-000001', $first['sale_number']);
        $this->assertSame('SL-000002', $second['sale_number']);
    }
}
