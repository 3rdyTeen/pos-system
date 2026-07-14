<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tax\StoreTaxRequest;
use App\Http\Requests\Tax\UpdateTaxRequest;
use App\Http\Resources\TaxResource;
use App\Models\Tax;
use App\Repositories\Contracts\TaxRepositoryInterface;
use App\Services\TaxService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TaxController extends Controller
{
    public function __construct(
        private readonly TaxService $service,
        private readonly TaxRepositoryInterface $taxes,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $taxes = $this->taxes->paginate($request->only([
            'search', 'status', 'company_id', 'type', 'sort', 'direction', 'per_page',
        ]));

        return TaxResource::collection($taxes);
    }

    public function store(StoreTaxRequest $request): JsonResponse
    {
        $tax = $this->service->create($request->validated());

        return TaxResource::make($tax->load('company'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateTaxRequest $request, Tax $tax): TaxResource
    {
        $tax = $this->service->update($tax, $request->validated());

        return TaxResource::make($tax->load('company'));
    }

    public function destroy(Tax $tax): JsonResponse
    {
        $this->service->delete($tax);

        return response()->json(['message' => 'Tax deleted.']);
    }
}
