<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShiftResource;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductBarcode;
use App\Models\ProductCategory;
use App\Models\Register;
use App\Repositories\Contracts\WarehouseRepositoryInterface;
use App\Services\PosProfileService;
use App\Services\SettingService;
use App\Services\ShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Everything the terminal needs to open and sell.
 *
 * These endpoints are shaped for a till rather than an admin table: one call to
 * boot the screen, one to find a product by hand, one to resolve a scan. The
 * catalogue endpoints here return a sellable view of a product (price, stock,
 * unit) rather than the full admin resource.
 */
class PosTerminalController extends Controller
{
    /**
     * Products returned to fill the tile grid before the cashier searches.
     */
    private const GRID_LIMIT = 60;

    public function __construct(
        private readonly PosProfileService $profiles,
        private readonly ShiftService $shifts,
        private readonly WarehouseRepositoryInterface $warehouses,
        private readonly SettingService $settings,
    ) {}

    /**
     * Boot the terminal: which register, under what configuration, with what
     * tenders, and whether a drawer is already open.
     */
    public function context(Request $request): JsonResponse
    {
        $register = $this->resolveRegister($request);
        $shift = $register ? $this->shifts->openShiftFor($register->id) : null;

        // The warehouse the sale will draw from. Handed to the terminal so the stock
        // it shows on a tile is the stock that will actually be taken.
        $warehouseId = $register?->branch_id
            ? $this->warehouses->defaultForBranch($register->branch_id)
            : null;

        // The company's capability switches, so the terminal can show only what the
        // control page has turned on rather than showing everything and letting the
        // server strip it at sale time.
        $flags = $this->settings->all($this->settings->resolveCompanyId($register?->branch?->company_id));

        return response()->json([
            'data' => [
                'register' => $register ? [
                    'id' => $register->id,
                    'name' => $register->name,
                    'branch_id' => $register->branch_id,
                    'branch' => $register->branch?->only(['id', 'name']),
                ] : null,
                'warehouse_id' => $warehouseId,
                // Always populated, even for a register with no profile — an
                // unconfigured till still has to be able to trade.
                'profile' => $this->profiles->resolveFor($register),
                'flags' => [
                    'modifiers_enabled' => $flags['modifiers.enabled'],
                    'combos_enabled' => $flags['combos.enabled'],
                    'allow_price_override' => $flags['sales.allow_price_override'],
                    'allow_line_discount' => $flags['sales.allow_line_discount'],
                    'show_stock' => $flags['terminal.show_stock'],
                ],
                'shift' => $shift ? ShiftResource::make($shift->load('user')) : null,
                'registers' => Register::query()
                    ->where('status', '!=', 'maintenance')
                    ->orderBy('name')
                    ->get(['id', 'name', 'branch_id']),
                'payment_methods' => PaymentMethod::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name', 'type']),
                'categories' => ProductCategory::query()
                    ->orderBy('name')
                    ->get(['id', 'name']),
            ],
        ]);
    }

    /**
     * The sellable catalogue, for the tile grid and the search box.
     */
    public function products(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $warehouseId = $request->query('warehouse_id');
        $flags = $this->settings->all($this->settings->resolveCompanyId());

        $products = Product::query()
            ->where('is_active', true)
            ->with(['tax:id,name,rate,is_inclusive,type,status', 'baseUnit:id,name'])
            // Backs `needs_configuration` without a query per tile.
            ->withCount('modifierGroups')
            // Eager loaded rather than looked up per tile, which would be one query
            // per product on every keystroke.
            ->when($warehouseId, fn ($query, string $id) => $query->with([
                'balances' => fn ($balances) => $balances->where('warehouse_id', $id),
            ]))
            ->when($search, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhereHas('barcodes', fn ($b) => $b->where('barcode', 'like', "{$search}%"));
                });
            })
            ->when($request->query('category_id'), fn ($query, string $id) => $query->where('category_id', $id))
            ->orderBy('name')
            ->limit(self::GRID_LIMIT)
            ->get();

        return response()->json([
            'data' => $products->map(fn (Product $product) => $this->sellable($product, $flags)),
        ]);
    }

    /**
     * Resolve a scan to a sellable line.
     *
     * A miss is a 404 rather than an empty list: the terminal beeps at the cashier
     * instead of silently adding nothing to the cart.
     */
    public function lookup(Request $request): JsonResponse
    {
        $request->validate(['barcode' => ['required', 'string', 'max:100']]);

        $warehouseId = $request->query('warehouse_id');

        $barcode = ProductBarcode::query()
            ->where('barcode', $request->query('barcode'))
            ->with([
                'product' => fn ($query) => $query->withCount('modifierGroups'),
                'product.tax',
                'product.baseUnit',
                'variant',
                ...($warehouseId ? ['product.balances' => fn ($balances) => $balances->where('warehouse_id', $warehouseId)] : []),
            ])
            ->first();

        if (! $barcode || ! $barcode->product) {
            return response()->json(['message' => 'No product matches that barcode.'], 404);
        }

        $flags = $this->settings->all($this->settings->resolveCompanyId($barcode->product->company_id));

        return response()->json([
            'data' => [
                ...$this->sellable($barcode->product, $flags),
                'product_variant_id' => $barcode->product_variant_id,
                'variant_name' => $barcode->variant?->name,
            ],
        ]);
    }

    /**
     * The choices a product offers, for the terminal's configurator.
     *
     * Returned on demand rather than with every tile: a menu's worth of groups and
     * slots is a lot of payload for something only needed once the cashier actually
     * taps an item.
     */
    public function configuration(Request $request, Product $product): JsonResponse
    {
        $companyId = $this->settings->resolveCompanyId($product->company_id);
        $flags = $this->settings->all($companyId);

        $groups = $flags['modifiers.enabled']
            ? $product->modifierGroups()->where('status', 'active')->with('options')->get()
            : collect();

        $slots = $flags['combos.enabled'] && $product->is_combo
            ? $product->comboSlots()->with('options.product:id,name')->get()
            : collect();

        return response()->json([
            'data' => [
                'product_id' => $product->id,
                'is_combo' => $product->is_combo,
                'groups' => $groups->map(function ($group) {
                    [$min, $max] = $group->selectionBounds();

                    return [
                        'id' => $group->id,
                        'name' => $group->name,
                        'selection_type' => $group->selection_type,
                        'is_required' => $group->is_required,
                        // The bounds the server will actually enforce, so the dialog and
                        // the validator cannot disagree about what "required" means.
                        'min_select' => $min,
                        'max_select' => $max,
                        'options' => $group->options->map(fn ($option) => [
                            'id' => $option->id,
                            'name' => $option->name,
                            'price_delta' => $option->price_delta,
                            'is_default' => $option->is_default,
                        ]),
                    ];
                }),
                'slots' => $slots->map(fn ($slot) => [
                    'id' => $slot->id,
                    'name' => $slot->name,
                    'quantity' => $slot->quantity,
                    'is_swappable' => $slot->is_swappable,
                    'options' => $slot->options->map(fn ($option) => [
                        'id' => $option->id,
                        'product_id' => $option->product_id,
                        'name' => $option->product?->name ?? 'Item',
                        'price_delta' => $option->price_delta,
                        'is_default' => $option->is_default,
                    ]),
                ]),
            ],
        ]);
    }

    /**
     * A product as the till sees it: what it costs, what tax it carries, and how
     * many are left.
     *
     * @param  array<string, bool>  $flags  The company's capability switches.
     * @return array<string, mixed>
     */
    private function sellable(Product $product, array $flags): array
    {
        $tax = $product->tax;
        $sellable = $tax && $tax->status === 'active' && in_array($tax->type, ['sales', 'both'], true);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'category_id' => $product->category_id,
            'unit_price' => $product->selling_price,
            'unit_id' => $product->base_unit_id,
            'unit_name' => $product->baseUnit?->name,
            'is_combo' => $product->is_combo,
            // Whether tapping this needs to open the configurator. Gated on the same
            // capability flags the configurator itself honours, so a product with
            // modifier groups does not open an empty dialog when modifiers are off.
            'needs_configuration' => ($flags['combos.enabled'] && $product->is_combo)
                || ($flags['modifiers.enabled'] && ($product->modifier_groups_count ?? 0) > 0),
            // Reported so the terminal can preview a line total; the server still
            // prices the sale itself.
            'tax_rate' => $sellable ? $tax->rate : null,
            'tax_inclusive' => $sellable ? $tax->is_inclusive : false,
            // Null when no warehouse was named, which reads as "not counted" rather
            // than a misleading zero.
            'stock_on_hand' => $product->relationLoaded('balances')
                ? (string) $product->balances->sum('quantity_on_hand')
                : null,
        ];
    }

    /**
     * The register the terminal is running on: the one asked for, else the user's
     * branch's first register, so a cashier is not made to choose on every load.
     */
    private function resolveRegister(Request $request): ?Register
    {
        $registerId = $request->query('register_id');

        if ($registerId) {
            return Register::query()->with('branch')->find($registerId);
        }

        return Register::query()
            ->with('branch')
            ->when($request->user()?->branch_id, fn ($query, string $id) => $query->where('branch_id', $id))
            ->where('status', '!=', 'maintenance')
            ->orderBy('name')
            ->first();
    }
}
