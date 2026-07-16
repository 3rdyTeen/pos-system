<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PurchaseReturn\StorePurchaseReturnRequest;
use App\Http\Requests\PurchaseReturn\UpdatePurchaseReturnRequest;
use App\Http\Resources\PurchaseReturnResource;
use App\Models\PurchaseReturn;
use App\Repositories\Contracts\PurchaseReturnRepositoryInterface;
use App\Services\PurchaseReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PurchaseReturnController extends Controller
{
    /**
     * Relations needed to render a single return with its lines.
     *
     * @var list<string>
     */
    private const WITH_DETAILS = ['purchaseOrder.supplier', 'branch', 'user', 'details.product', 'details.variant'];

    public function __construct(
        private readonly PurchaseReturnService $service,
        private readonly PurchaseReturnRepositoryInterface $returns,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $returns = $this->returns->paginate($request->only([
            'search', 'status', 'purchase_order_id', 'sort', 'direction', 'per_page',
        ]));

        return PurchaseReturnResource::collection($returns);
    }

    /**
     * A single return with its lines, used to hydrate the edit form.
     */
    public function show(PurchaseReturn $purchaseReturn): PurchaseReturnResource
    {
        return PurchaseReturnResource::make($purchaseReturn->load(self::WITH_DETAILS));
    }

    public function store(StorePurchaseReturnRequest $request): JsonResponse
    {
        $data = $request->validated();
        $details = $data['details'] ?? [];
        unset($data['details']);

        // The raiser is taken from the session, never from the payload.
        $data['user_id'] = $request->user()->id;

        $return = $this->service->create($data, $details);

        return PurchaseReturnResource::make($return->load(self::WITH_DETAILS))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdatePurchaseReturnRequest $request, PurchaseReturn $purchaseReturn): PurchaseReturnResource
    {
        $data = $request->validated();
        // Absent means "leave the lines and total alone"; present-but-empty clears them.
        $details = array_key_exists('details', $data) ? $data['details'] : null;
        unset($data['details']);

        $return = $this->service->update($purchaseReturn, $data, $details);

        return PurchaseReturnResource::make($return->load(self::WITH_DETAILS));
    }

    public function destroy(PurchaseReturn $purchaseReturn): JsonResponse
    {
        $this->service->delete($purchaseReturn);

        return response()->json(['message' => 'Return deleted.']);
    }
}
