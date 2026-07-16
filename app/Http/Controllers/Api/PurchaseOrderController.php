<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PurchaseOrder\ReceivePurchaseOrderRequest;
use App\Http\Requests\PurchaseOrder\StorePurchaseOrderRequest;
use App\Http\Requests\PurchaseOrder\UpdatePurchaseOrderRequest;
use App\Http\Resources\PurchaseOrderResource;
use App\Models\PurchaseOrder;
use App\Repositories\Contracts\PurchaseOrderRepositoryInterface;
use App\Services\PurchaseOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PurchaseOrderController extends Controller
{
    /**
     * Relations needed to render a single order with its lines.
     *
     * @var list<string>
     */
    private const WITH_DETAILS = ['branch', 'warehouse', 'supplier', 'details.product', 'details.variant'];

    public function __construct(
        private readonly PurchaseOrderService $service,
        private readonly PurchaseOrderRepositoryInterface $orders,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $this->orders->paginate($request->only([
            'search', 'status', 'supplier_id', 'warehouse_id', 'sort', 'direction', 'per_page',
        ]));

        return PurchaseOrderResource::collection($orders);
    }

    /**
     * Orders for selection inputs (the return form's PO dropdown).
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->orders->options($request->query('supplier_id')),
        ]);
    }

    /**
     * A single order with its lines, used to hydrate the edit and receive forms.
     */
    public function show(PurchaseOrder $purchaseOrder): PurchaseOrderResource
    {
        return PurchaseOrderResource::make($this->loaded($purchaseOrder));
    }

    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $details = $data['details'] ?? [];
        unset($data['details']);

        // The raiser is taken from the session, never from the payload.
        $data['user_id'] = $request->user()->id;

        $order = $this->service->create($data, $details);

        return PurchaseOrderResource::make($this->loaded($order))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): PurchaseOrderResource
    {
        $data = $request->validated();
        // Absent means "leave the lines and totals alone"; present-but-empty clears them.
        $details = array_key_exists('details', $data) ? $data['details'] : null;
        unset($data['details']);

        $order = $this->service->update($purchaseOrder, $data, $details);

        return PurchaseOrderResource::make($this->loaded($order));
    }

    /**
     * Record received quantities against the order's lines.
     */
    public function receive(ReceivePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): PurchaseOrderResource
    {
        $order = $this->service->receive($purchaseOrder, $request->validated()['lines']);

        return PurchaseOrderResource::make($this->loaded($order));
    }

    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse
    {
        $this->service->delete($purchaseOrder);

        return response()->json(['message' => 'Purchase order deleted.']);
    }

    /**
     * Load the relations and the payment sum the resource reports on.
     */
    private function loaded(PurchaseOrder $order): PurchaseOrder
    {
        return $order->load(self::WITH_DETAILS)->loadSum('payments as paid_total', 'amount');
    }
}
