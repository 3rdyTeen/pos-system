<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SalesDetail;
use App\Repositories\Contracts\SaleRepositoryInterface;
use App\Repositories\Contracts\WarehouseRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Ringing up, holding, completing and voiding sales.
 *
 * Money is never taken from the client. The terminal sends what was scanned —
 * product, quantity, which options were picked — and this service prices it from
 * the catalogue, so a tampered payload cannot change what a sale is worth. The form
 * requests do not even accept the total columns. SaleLinePricer does the per-line
 * work; this owns the sale as a whole.
 *
 * Stock is posted here through StockPostingService, and only for a `completed`
 * sale: a held cart has not left the shop, so it must not move inventory.
 */
class SaleService
{
    private const PREFIX = 'SL-';

    /**
     * Statuses whose lines may still be edited. Once a sale is completed its lines
     * are history and are corrected by a void or a return, never in place.
     *
     * @var list<string>
     */
    private const EDITABLE = ['draft', 'held'];

    /**
     * How a sale's stock is filed in the ledger, and how it is unwound.
     */
    private const MOVEMENT_OUT = 'sale';

    private const MOVEMENT_BACK = 'return_in';

    public function __construct(
        private readonly SaleRepositoryInterface $sales,
        private readonly WarehouseRepositoryInterface $warehouses,
        private readonly StockPostingService $stock,
        private readonly PosProfileService $profiles,
        private readonly SaleLinePricer $pricer,
        private readonly SettingService $settings,
    ) {}

    /**
     * Ring up a sale. A `completed` status posts stock and settles the payments;
     * `held` or `draft` parks the cart and touches neither.
     *
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $lines
     * @param  list<array<string, mixed>>  $payments
     */
    public function create(array $data, array $lines, array $payments = []): Sale
    {
        return DB::transaction(function () use ($data, $lines, $payments) {
            [$details, $taxes, $totals] = $this->price($lines, $this->companyFor($data['branch_id']));

            $data['sale_number'] ??= $this->nextNumber();
            $data['warehouse_id'] ??= $this->resolveWarehouse($data['branch_id']);

            $status = $data['status'] ?? 'completed';
            $paid = $this->sumPayments($payments, $totals['grand_total'], $status);

            $sale = $this->sales->create([
                ...$data,
                ...$totals,
                ...$this->settle((float) $totals['grand_total'], $paid, $status),
            ]);

            $this->sales->syncDetails($sale, $details);
            $this->sales->syncTaxes($sale, $taxes);
            $this->sales->syncPayments($sale, $payments, $data['user_id'] ?? null);

            if ($status === 'completed') {
                $this->postStock($sale);
            }

            return $sale;
        });
    }

    /**
     * Amend a parked cart. Refuses to touch a sale that has already been completed
     * or voided.
     *
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>|null  $lines  Null leaves the lines and totals untouched.
     */
    public function update(Sale $sale, array $data, ?array $lines = null): Sale
    {
        $this->assertEditable($sale);

        return DB::transaction(function () use ($sale, $data, $lines) {
            if ($lines !== null) {
                [$details, $taxes, $totals] = $this->price($lines, $this->companyFor($sale->branch_id));
                $data = [
                    ...$data,
                    ...$totals,
                    ...$this->settle((float) $totals['grand_total'], 0.0, $data['status'] ?? $sale->status),
                ];
            }

            $sale = $this->sales->update($sale, $data);

            if ($lines !== null) {
                $this->sales->syncDetails($sale, $details);
                $this->sales->syncTaxes($sale, $taxes);
            }

            return $sale;
        });
    }

    /**
     * Take payment for a parked cart and hand the goods over: this is the moment
     * stock actually leaves the shop.
     *
     * @param  list<array<string, mixed>>  $payments
     *
     * @throws ValidationException
     */
    public function complete(Sale $sale, array $payments): Sale
    {
        if (! in_array($sale->status, self::EDITABLE, true)) {
            throw ValidationException::withMessages([
                'status' => 'Only a held or draft sale can be completed.',
            ]);
        }

        if ($sale->details()->count() === 0) {
            throw ValidationException::withMessages([
                'lines' => 'A sale cannot be completed with no items on it.',
            ]);
        }

        return DB::transaction(function () use ($sale, $payments) {
            $paid = $this->sumPayments($payments, (float) $sale->grand_total, 'completed');

            $this->sales->syncPayments($sale, $payments, $sale->user_id);

            $sale = $this->sales->update($sale, [
                'status' => 'completed',
                'sale_date' => now(),
                ...$this->settle((float) $sale->grand_total, $paid, 'completed'),
            ]);

            $this->postStock($sale);

            return $sale;
        });
    }

    /**
     * Reverse a completed sale, returning its stock.
     *
     * The sale is kept and flagged rather than deleted — sales_details has no
     * cascade, and a vanished receipt is not auditable.
     *
     * @throws ValidationException
     */
    public function void(Sale $sale): Sale
    {
        if ($sale->status === 'void') {
            throw ValidationException::withMessages([
                'status' => 'This sale has already been voided.',
            ]);
        }

        if ($sale->status !== 'completed') {
            throw ValidationException::withMessages([
                'status' => 'Only a completed sale can be voided.',
            ]);
        }

        $returns = $this->sales->returnsCount($sale);

        if ($returns > 0) {
            throw ValidationException::withMessages([
                'sale' => "This sale cannot be voided because it has {$returns} return(s) against it.",
            ]);
        }

        return DB::transaction(function () use ($sale) {
            $this->stock->reverse(
                referenceType: 'sale',
                referenceId: $sale->id,
                movementType: self::MOVEMENT_BACK,
                userId: $sale->user_id,
            );

            return $this->sales->update($sale, [
                'status' => 'void',
                'amount_paid' => 0,
                'amount_due' => 0,
                'payment_status' => 'unpaid',
            ]);
        });
    }

    /**
     * Discard a parked cart. Only ever a held or draft sale — a completed one is
     * voided instead, which is why this is not a general delete.
     *
     * @throws ValidationException
     */
    public function delete(Sale $sale): void
    {
        $this->assertEditable($sale);

        DB::transaction(fn () => $this->sales->delete($sale));
    }

    /**
     * Take the sale's stock out of its warehouse.
     *
     * What actually leaves the shop is not always the thing on the line:
     *
     * - A plain product deducts itself.
     * - A combo deducts its components instead — the combo itself is a price and a
     *   name, and has no stock of its own.
     * - A modifier that points at a product deducts that too, so "extra cheese"
     *   draws down cheese while "no onions" moves nothing.
     */
    private function postStock(Sale $sale): void
    {
        if ($sale->warehouse_id === null) {
            throw ValidationException::withMessages([
                'warehouse_id' => 'This sale has no warehouse to draw stock from. Set a default warehouse on the branch.',
            ]);
        }

        $allowNegative = $this->profiles->resolveFor($sale->register)['allow_negative_stock'];
        $details = $sale->details()->with(['product:id,name,is_combo', 'components', 'modifiers'])->get();

        foreach ($details->values() as $index => $detail) {
            $quantity = (float) $detail->quantity;

            foreach ($this->consumed($detail, $quantity) as $item) {
                $this->stock->post(
                    warehouseId: $sale->warehouse_id,
                    productId: $item['product_id'],
                    productVariantId: $item['product_variant_id'],
                    movementType: self::MOVEMENT_OUT,
                    // Negative: the goods are leaving.
                    quantity: -1 * $item['quantity'],
                    referenceType: 'sale',
                    referenceId: $sale->id,
                    userId: $sale->user_id,
                    allowNegative: $allowNegative,
                    errorKey: "lines.{$index}.quantity",
                    productName: $item['name'],
                );
            }
        }
    }

    /**
     * The real products one sale line consumes, and how many of each.
     *
     * @return list<array{product_id: string, product_variant_id: string|null, quantity: float, name: string|null}>
     */
    private function consumed(SalesDetail $detail, float $quantity): array
    {
        $items = [];

        if ($detail->product?->is_combo) {
            // The slot quantity is per single combo, so it multiplies by the line's.
            foreach ($detail->components as $component) {
                $items[] = [
                    'product_id' => $component->product_id,
                    'product_variant_id' => null,
                    'quantity' => (float) $component->quantity * $quantity,
                    'name' => $component->name,
                ];
            }
        } else {
            $items[] = [
                'product_id' => $detail->product_id,
                'product_variant_id' => $detail->product_variant_id,
                'quantity' => $quantity,
                'name' => $detail->product?->name,
            ];
        }

        foreach ($detail->modifiers as $modifier) {
            if ($modifier->product_id === null) {
                continue;
            }

            $items[] = [
                'product_id' => $modifier->product_id,
                'product_variant_id' => null,
                'quantity' => $quantity,
                'name' => $modifier->name,
            ];
        }

        return $items;
    }

    /**
     * Price the cart from the catalogue.
     *
     * Per line the maths lives in SaleLinePricer, which also validates the choices
     * made against the product and expands a combo into the real products it
     * consumes. This adds them up.
     *
     * Header:  subtotal    = sum of gross (before discount, before any tax)
     *          grand_total = sum of line_total, which already reflects the tax mode
     *
     * @param  list<array<string, mixed>>  $lines
     * @param  string|null  $companyId  Whose feature switches apply.
     * @return array{0: list<array<string, mixed>>, 1: list<array<string, mixed>>, 2: array<string, float>}
     */
    private function price(array $lines, ?string $companyId): array
    {
        $products = Product::query()
            ->with(['tax', 'modifierGroups.options', 'comboSlots.options.product:id,name'])
            ->findMany(array_column($lines, 'product_id'))
            ->keyBy('id');

        $flags = $this->settings->all($companyId);

        $built = [];
        $taxes = [];
        $subtotal = 0.0;
        $taxTotal = 0.0;
        $discountTotal = 0.0;
        $grandTotal = 0.0;

        foreach ($lines as $index => $line) {
            $product = $products->get($line['product_id']);

            if (! $product) {
                throw ValidationException::withMessages([
                    "lines.{$index}.product_id" => 'This product no longer exists.',
                ]);
            }

            $result = $this->pricer->build(
                product: $product,
                line: $line,
                index: $index,
                modifiersEnabled: $flags['modifiers.enabled'],
                combosEnabled: $flags['combos.enabled'],
                allowPriceOverride: $flags['sales.allow_price_override'],
                allowDiscount: $flags['sales.allow_line_discount'],
            );

            $built[] = [
                'detail' => $result['detail'],
                'modifiers' => $result['modifiers'],
                'components' => $result['components'],
            ];

            if ($result['tax']) {
                $taxes[] = $result['tax'];
            }

            $subtotal += $result['gross'];
            $discountTotal += $result['discount'];
            $taxTotal += (float) $result['detail']['tax_amount'];
            $grandTotal += (float) $result['detail']['line_total'];
        }

        return [$built, $taxes, [
            'subtotal' => round($subtotal, 2),
            'discount_total' => round($discountTotal, 2),
            'tax_total' => round($taxTotal, 2),
            'grand_total' => round($grandTotal, 2),
        ]];
    }

    /**
     * The company whose feature switches govern a sale, via its branch.
     */
    private function companyFor(string $branchId): ?string
    {
        return Branch::query()->whereKey($branchId)->value('company_id');
    }

    /**
     * Total the tenders, rejecting anything that would record more money than the
     * sale is worth.
     *
     * Change is not a tender: for a 320 sale paid with a 500 note the terminal
     * applies 320 and hands back 180. Recording the 500 would overstate takings and
     * silently break the drawer reconciliation.
     *
     * @param  list<array<string, mixed>>  $payments
     *
     * @throws ValidationException
     */
    private function sumPayments(array $payments, float $grandTotal, string $status): float
    {
        if ($payments === []) {
            return 0.0;
        }

        if ($status !== 'completed') {
            throw ValidationException::withMessages([
                'payments' => 'A held or draft sale cannot carry payments. Complete it to take payment.',
            ]);
        }

        $paid = round(array_sum(array_map(fn ($p) => (float) $p['amount'], $payments)), 2);

        if ($paid > $grandTotal) {
            throw ValidationException::withMessages([
                'payments' => "The payments total {$paid}, which is more than the sale's {$grandTotal}. Record the amount applied, not the cash tendered.",
            ]);
        }

        return $paid;
    }

    /**
     * Derive the money-owed columns and the payment status.
     *
     * @return array<string, mixed>
     */
    private function settle(float $grandTotal, float $paid, string $status): array
    {
        // A parked cart owes nothing yet — it is not a debt until it is completed.
        if ($status !== 'completed') {
            return [
                'amount_paid' => 0,
                'amount_due' => 0,
                'payment_status' => 'unpaid',
            ];
        }

        $due = round($grandTotal - $paid, 2);

        return [
            'amount_paid' => $paid,
            'amount_due' => $due,
            'payment_status' => match (true) {
                $paid <= 0 => 'unpaid',
                $due > 0 => 'partial',
                default => 'paid',
            },
        ];
    }

    /**
     * The warehouse a branch's sales draw stock from.
     *
     * Shared with the terminal's context endpoint so the stock the cashier is shown
     * is the stock the sale actually takes.
     */
    private function resolveWarehouse(string $branchId): ?string
    {
        return $this->warehouses->defaultForBranch($branchId);
    }

    /**
     * @throws ValidationException
     */
    private function assertEditable(Sale $sale): void
    {
        if (! in_array($sale->status, self::EDITABLE, true)) {
            throw ValidationException::withMessages([
                'status' => "A {$sale->status} sale can no longer be edited. Void it or raise a return instead.",
            ]);
        }
    }

    /**
     * Next document number in the SL-000001 sequence. Zero padding keeps the numbers
     * sortable as strings, which is what the lookup relies on.
     */
    private function nextNumber(): string
    {
        $latest = $this->sales->latestNumber(self::PREFIX);
        $sequence = $latest ? ((int) substr($latest, strlen(self::PREFIX))) + 1 : 1;

        return self::PREFIX.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
