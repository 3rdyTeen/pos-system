<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Unit\StoreUnitRequest;
use App\Http\Requests\Unit\UpdateUnitRequest;
use App\Http\Resources\UnitResource;
use App\Models\Unit;
use App\Repositories\Contracts\UnitRepositoryInterface;
use App\Services\UnitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UnitController extends Controller
{
    public function __construct(
        private readonly UnitService $service,
        private readonly UnitRepositoryInterface $units,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $units = $this->units->paginate($request->only([
            'search', 'company_id', 'sort', 'direction', 'per_page',
        ]));

        return UnitResource::collection($units);
    }

    /**
     * Units for selection inputs (e.g. the base-unit dropdown).
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->units->options($request->query('company_id')),
        ]);
    }

    public function store(StoreUnitRequest $request): JsonResponse
    {
        $unit = $this->service->create($request->validated());

        return UnitResource::make($unit->load(['company', 'baseUnit']))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateUnitRequest $request, Unit $unit): UnitResource
    {
        $unit = $this->service->update($unit, $request->validated());

        return UnitResource::make($unit->load(['company', 'baseUnit']));
    }

    public function destroy(Unit $unit): JsonResponse
    {
        $this->service->delete($unit);

        return response()->json(['message' => 'Unit deleted.']);
    }
}
