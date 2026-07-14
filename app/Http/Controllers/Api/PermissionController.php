<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use App\Repositories\Contracts\PermissionRepositoryInterface;
use App\Services\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PermissionController extends Controller
{
    public function __construct(
        private readonly PermissionService $service,
        private readonly PermissionRepositoryInterface $permissions,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $permissions = $this->permissions->paginate($request->only(['search', 'status', 'sort', 'direction', 'per_page']));

        return PermissionResource::collection($permissions);
    }

    public function enabled(): JsonResponse
    {
        return response()->json(['data' => $this->permissions->enabled()]);
    }

    public function store(StorePermissionRequest $request): JsonResponse
    {
        $permission = $this->service->create($request->validated());

        return PermissionResource::make($permission)->response()->setStatusCode(201);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): PermissionResource
    {
        return PermissionResource::make($this->service->update($permission, $request->validated()));
    }

    public function toggle(Permission $permission): PermissionResource
    {
        return PermissionResource::make($this->service->toggle($permission));
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $this->service->delete($permission);

        return response()->json(['message' => 'Permission deleted.']);
    }
}
