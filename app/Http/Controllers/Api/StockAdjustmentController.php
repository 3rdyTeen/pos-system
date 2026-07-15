<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockAdjustment\StoreStockAdjustmentRequest;
use App\Http\Requests\StockAdjustment\UpdateStockAdjustmentRequest;
use App\Http\Resources\StockAdjustmentResource;
use App\Models\StockAdjustment;
use App\Repositories\Contracts\StockAdjustmentRepositoryInterface;
use App\Services\StockAdjustmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StockAdjustmentController extends Controller
{
    /**
     * Relations needed to render a single adjustment with its lines.
     *
     * @var list<string>
     */
    private const WITH_DETAILS = ['warehouse', 'adjustedBy', 'details.product', 'details.variant'];

    public function __construct(
        private readonly StockAdjustmentService $service,
        private readonly StockAdjustmentRepositoryInterface $adjustments,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $adjustments = $this->adjustments->paginate($request->only([
            'search', 'status', 'warehouse_id', 'sort', 'direction', 'per_page',
        ]));

        return StockAdjustmentResource::collection($adjustments);
    }

    /**
     * A single adjustment with its lines, used to hydrate the edit form.
     */
    public function show(StockAdjustment $stockAdjustment): StockAdjustmentResource
    {
        return StockAdjustmentResource::make($stockAdjustment->load(self::WITH_DETAILS));
    }

    public function store(StoreStockAdjustmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $details = $data['details'] ?? [];
        unset($data['details']);

        $adjustment = $this->service->create($data, $details);

        return StockAdjustmentResource::make($adjustment->load(self::WITH_DETAILS))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateStockAdjustmentRequest $request, StockAdjustment $stockAdjustment): StockAdjustmentResource
    {
        $data = $request->validated();
        // Absent means "leave the lines alone"; present-but-empty means "clear them".
        $details = array_key_exists('details', $data) ? $data['details'] : null;
        unset($data['details']);

        $adjustment = $this->service->update($stockAdjustment, $data, $details);

        return StockAdjustmentResource::make($adjustment->load(self::WITH_DETAILS));
    }

    public function destroy(StockAdjustment $stockAdjustment): JsonResponse
    {
        $this->service->delete($stockAdjustment);

        return response()->json(['message' => 'Adjustment deleted.']);
    }
}
