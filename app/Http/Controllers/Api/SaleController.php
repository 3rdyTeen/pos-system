<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sale\CompleteSaleRequest;
use App\Http\Requests\Sale\StoreSaleRequest;
use App\Http\Requests\Sale\UpdateSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Repositories\Contracts\SaleRepositoryInterface;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SaleController extends Controller
{
    /**
     * Relations needed to render a single sale with its lines and tenders.
     *
     * @var list<string>
     */
    private const WITH_DETAILS = [
        'branch', 'warehouse', 'register', 'customer', 'user',
        'details.product', 'details.variant', 'details.unit',
        'details.modifiers', 'details.components',
        'payments.paymentMethod', 'taxes',
    ];

    public function __construct(
        private readonly SaleService $service,
        private readonly SaleRepositoryInterface $sales,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $sales = $this->sales->paginate($request->only([
            'search', 'status', 'payment_status', 'customer_id', 'register_id',
            'branch_id', 'shift_id', 'user_id', 'from', 'to',
            'sort', 'direction', 'per_page',
        ]));

        return SaleResource::collection($sales);
    }

    /**
     * Completed sales for selection inputs (the return form's sale dropdown).
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->sales->options($request->query('customer_id')),
        ]);
    }

    /**
     * Carts parked on a register, for the terminal's resume list.
     */
    public function held(Request $request): AnonymousResourceCollection
    {
        return SaleResource::collection($this->sales->held($request->query('register_id')));
    }

    public function show(Sale $sale): SaleResource
    {
        return SaleResource::make($this->loaded($sale));
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $lines = $data['lines'] ?? [];
        $payments = $data['payments'] ?? [];
        unset($data['lines'], $data['payments']);

        // The cashier is taken from the session, never from the payload.
        $data['user_id'] = $request->user()->id;

        $sale = $this->service->create($data, $lines, $payments);

        return SaleResource::make($this->loaded($sale))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateSaleRequest $request, Sale $sale): SaleResource
    {
        $data = $request->validated();
        // Absent means "leave the lines and totals alone"; present-but-empty clears them.
        $lines = array_key_exists('lines', $data) ? $data['lines'] : null;
        unset($data['lines']);

        return SaleResource::make($this->loaded($this->service->update($sale, $data, $lines)));
    }

    /**
     * Take payment for a parked cart and release its stock.
     */
    public function complete(CompleteSaleRequest $request, Sale $sale): SaleResource
    {
        $sale = $this->service->complete($sale, $request->validated()['payments']);

        return SaleResource::make($this->loaded($sale));
    }

    /**
     * Reverse a completed sale, returning its stock.
     */
    public function void(Sale $sale): SaleResource
    {
        return SaleResource::make($this->loaded($this->service->void($sale)));
    }

    /**
     * Discard a parked cart. A completed sale is voided instead.
     */
    public function destroy(Sale $sale): JsonResponse
    {
        $this->service->delete($sale);

        return response()->json(['message' => 'Sale deleted.']);
    }

    private function loaded(Sale $sale): Sale
    {
        return $sale->load(self::WITH_DETAILS);
    }
}
