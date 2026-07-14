<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\StoreCompanyRequest;
use App\Http\Requests\Company\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Services\CompanyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CompanyController extends Controller
{
    public function __construct(
        private readonly CompanyService $service,
        private readonly CompanyRepositoryInterface $companies,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $companies = $this->companies->paginate($request->only([
            'search', 'status', 'sort', 'direction', 'per_page',
        ]));

        return CompanyResource::collection($companies);
    }

    /**
     * Companies for selection inputs.
     */
    public function options(): JsonResponse
    {
        return response()->json([
            'data' => $this->companies->options(),
        ]);
    }

    public function store(StoreCompanyRequest $request): JsonResponse
    {
        $company = $this->service->create($request->validated());

        return CompanyResource::make($company)
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCompanyRequest $request, Company $company): CompanyResource
    {
        $company = $this->service->update($company, $request->validated());

        return CompanyResource::make($company);
    }

    public function destroy(Company $company): JsonResponse
    {
        $this->service->delete($company);

        return response()->json(['message' => 'Company deleted.']);
    }
}
