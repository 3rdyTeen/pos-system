<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Navigation\StoreNavigationRequest;
use App\Http\Requests\Navigation\UpdateNavigationRequest;
use App\Http\Resources\NavigationResource;
use App\Models\Navigation;
use App\Repositories\Contracts\NavigationRepositoryInterface;
use App\Services\NavigationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NavigationController extends Controller
{
    public function __construct(
        private readonly NavigationService $service,
        private readonly NavigationRepositoryInterface $navigations,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $navigations = $this->navigations->paginate($request->only(['search', 'module_id', 'sort', 'direction', 'per_page']));

        return NavigationResource::collection($navigations);
    }

    public function store(StoreNavigationRequest $request): JsonResponse
    {
        $navigation = $this->service->create($request->validated());

        return NavigationResource::make($navigation->load(['module', 'parent']))->response()->setStatusCode(201);
    }

    public function update(UpdateNavigationRequest $request, Navigation $navigation): NavigationResource
    {
        $navigation = $this->service->update($navigation, $request->validated());

        return NavigationResource::make($navigation->load(['module', 'parent']));
    }

    public function destroy(Navigation $navigation): JsonResponse
    {
        $this->service->delete($navigation);

        return response()->json(['message' => 'Navigation deleted.']);
    }
}
