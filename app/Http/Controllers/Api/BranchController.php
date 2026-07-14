<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Branch\StoreBranchRequest;
use App\Http\Requests\Branch\UpdateBranchRequest;
use App\Http\Resources\BranchResource;
use App\Models\Branch;
use App\Repositories\Contracts\BranchRepositoryInterface;
use App\Services\BranchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BranchController extends Controller
{
    public function __construct(
        private readonly BranchService $service,
        private readonly BranchRepositoryInterface $branches,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $branches = $this->branches->paginate($request->only([
            'search', 'status', 'company_id', 'sort', 'direction', 'per_page',
        ]));

        return BranchResource::collection($branches);
    }

    /**
     * Branches for selection inputs.
     */
    public function options(): JsonResponse
    {
        return response()->json([
            'data' => $this->branches->options(),
        ]);
    }

    public function store(StoreBranchRequest $request): JsonResponse
    {
        $branch = $this->service->create($request->validated());

        return BranchResource::make($branch->load('company'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateBranchRequest $request, Branch $branch): BranchResource
    {
        $branch = $this->service->update($branch, $request->validated());

        return BranchResource::make($branch->load('company'));
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $this->service->delete($branch);

        return response()->json(['message' => 'Branch deleted.']);
    }
}
