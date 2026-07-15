<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Warehouse\StoreWarehouseRequest;
use App\Http\Requests\Warehouse\UpdateWarehouseRequest;
use App\Http\Resources\WarehouseResource;
use App\Models\Warehouse;
use App\Repositories\Contracts\WarehouseRepositoryInterface;
use App\Services\WarehouseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WarehouseController extends Controller
{
    public function __construct(
        private readonly WarehouseService $service,
        private readonly WarehouseRepositoryInterface $warehouses,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $warehouses = $this->warehouses->paginate($request->only([
            'search', 'status', 'branch_id', 'company_id', 'sort', 'direction', 'per_page',
        ]));

        return WarehouseResource::collection($warehouses);
    }

    /**
     * Warehouses for selection inputs.
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->warehouses->options($request->query('branch_id')),
        ]);
    }

    public function store(StoreWarehouseRequest $request): JsonResponse
    {
        $warehouse = $this->service->create($request->validated());

        return WarehouseResource::make($warehouse->load(['branch']))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): WarehouseResource
    {
        $warehouse = $this->service->update($warehouse, $request->validated());

        return WarehouseResource::make($warehouse->load(['branch']));
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $this->service->delete($warehouse);

        return response()->json(['message' => 'Warehouse deleted.']);
    }
}
