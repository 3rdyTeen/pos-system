<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Repositories\Contracts\SupplierRepositoryInterface;
use App\Services\SupplierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SupplierController extends Controller
{
    public function __construct(
        private readonly SupplierService $service,
        private readonly SupplierRepositoryInterface $suppliers,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $suppliers = $this->suppliers->paginate($request->only([
            'search', 'status', 'company_id', 'sort', 'direction', 'per_page',
        ]));

        return SupplierResource::collection($suppliers);
    }

    /**
     * Suppliers for selection inputs.
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->suppliers->options($request->query('company_id')),
        ]);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = $this->service->create($request->validated());

        return SupplierResource::make($supplier->load(['company']))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): SupplierResource
    {
        $supplier = $this->service->update($supplier, $request->validated());

        return SupplierResource::make($supplier->load(['company']));
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $this->service->delete($supplier);

        return response()->json(['message' => 'Supplier deleted.']);
    }
}
