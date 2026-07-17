<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SalesReturn\StoreSalesReturnRequest;
use App\Http\Requests\SalesReturn\UpdateSalesReturnRequest;
use App\Http\Resources\SalesReturnResource;
use App\Models\SalesReturn;
use App\Repositories\Contracts\SalesReturnRepositoryInterface;
use App\Services\SalesReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SalesReturnController extends Controller
{
    /**
     * @var list<string>
     */
    private const WITH_DETAILS = ['sale.customer', 'branch', 'user', 'details.product'];

    public function __construct(
        private readonly SalesReturnService $service,
        private readonly SalesReturnRepositoryInterface $returns,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $returns = $this->returns->paginate($request->only([
            'search', 'status', 'sale_id', 'branch_id', 'sort', 'direction', 'per_page',
        ]));

        return SalesReturnResource::collection($returns);
    }

    public function show(SalesReturn $salesReturn): SalesReturnResource
    {
        return SalesReturnResource::make($this->loaded($salesReturn));
    }

    public function store(StoreSalesReturnRequest $request): JsonResponse
    {
        $data = $request->validated();
        $lines = $data['lines'] ?? [];
        unset($data['lines']);

        // The refunder is taken from the session, never from the payload.
        $data['user_id'] = $request->user()->id;

        $return = $this->service->create($data, $lines);

        return SalesReturnResource::make($this->loaded($return))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateSalesReturnRequest $request, SalesReturn $salesReturn): SalesReturnResource
    {
        $data = $request->validated();
        $lines = array_key_exists('lines', $data) ? $data['lines'] : null;
        unset($data['lines']);

        return SalesReturnResource::make($this->loaded($this->service->update($salesReturn, $data, $lines)));
    }

    public function destroy(SalesReturn $salesReturn): JsonResponse
    {
        $this->service->delete($salesReturn);

        return response()->json(['message' => 'Sales return deleted.']);
    }

    private function loaded(SalesReturn $return): SalesReturn
    {
        return $return->load(self::WITH_DETAILS);
    }
}
