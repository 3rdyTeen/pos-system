<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockTransfer\StoreStockTransferRequest;
use App\Http\Requests\StockTransfer\UpdateStockTransferRequest;
use App\Http\Resources\StockTransferResource;
use App\Models\StockTransfer;
use App\Repositories\Contracts\StockTransferRepositoryInterface;
use App\Services\StockTransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StockTransferController extends Controller
{
    /**
     * Relations needed to render a single transfer with its lines.
     *
     * @var list<string>
     */
    private const WITH_DETAILS = ['fromWarehouse', 'toWarehouse', 'requestedBy', 'details.product', 'details.variant'];

    public function __construct(
        private readonly StockTransferService $service,
        private readonly StockTransferRepositoryInterface $transfers,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $transfers = $this->transfers->paginate($request->only([
            'search', 'status', 'warehouse_id', 'sort', 'direction', 'per_page',
        ]));

        return StockTransferResource::collection($transfers);
    }

    /**
     * A single transfer with its lines, used to hydrate the edit form.
     */
    public function show(StockTransfer $stockTransfer): StockTransferResource
    {
        return StockTransferResource::make($stockTransfer->load(self::WITH_DETAILS));
    }

    public function store(StoreStockTransferRequest $request): JsonResponse
    {
        $data = $request->validated();
        $details = $data['details'] ?? [];
        unset($data['details']);

        $transfer = $this->service->create($data, $details);

        return StockTransferResource::make($transfer->load(self::WITH_DETAILS))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateStockTransferRequest $request, StockTransfer $stockTransfer): StockTransferResource
    {
        $data = $request->validated();
        // Absent means "leave the lines alone"; present-but-empty means "clear them".
        $details = array_key_exists('details', $data) ? $data['details'] : null;
        unset($data['details']);

        $transfer = $this->service->update($stockTransfer, $data, $details);

        return StockTransferResource::make($transfer->load(self::WITH_DETAILS));
    }

    public function destroy(StockTransfer $stockTransfer): JsonResponse
    {
        $this->service->delete($stockTransfer);

        return response()->json(['message' => 'Transfer deleted.']);
    }
}
