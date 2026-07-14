<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Module\StoreModuleRequest;
use App\Http\Requests\Module\UpdateModuleRequest;
use App\Http\Resources\ModuleResource;
use App\Models\Module;
use App\Repositories\Contracts\ModuleRepositoryInterface;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ModuleController extends Controller
{
    public function __construct(
        private readonly ModuleService $service,
        private readonly ModuleRepositoryInterface $modules,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $modules = $this->modules->paginate($request->only(['search', 'status', 'sort', 'direction', 'per_page']));

        return ModuleResource::collection($modules);
    }

    public function enabled(): JsonResponse
    {
        return response()->json(['data' => $this->modules->enabled()]);
    }

    public function store(StoreModuleRequest $request): JsonResponse
    {
        $module = $this->service->create($request->validated());

        return ModuleResource::make($module)->response()->setStatusCode(201);
    }

    public function update(UpdateModuleRequest $request, Module $module): ModuleResource
    {
        return ModuleResource::make($this->service->update($module, $request->validated()));
    }

    public function toggle(Module $module): ModuleResource
    {
        return ModuleResource::make($this->service->toggle($module));
    }

    public function destroy(Module $module): JsonResponse
    {
        $this->service->delete($module);

        return response()->json(['message' => 'Module deleted.']);
    }
}
