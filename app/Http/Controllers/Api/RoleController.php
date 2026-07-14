<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\SaveRolePermissionsRequest;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Services\RolePermissionService;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RoleController extends Controller
{
    public function __construct(
        private readonly RoleService $service,
        private readonly RoleRepositoryInterface $roles,
        private readonly RolePermissionService $rolePermissions,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $roles = $this->roles->paginate($request->only([
            'search', 'status', 'sort', 'direction', 'per_page',
        ]));

        return RoleResource::collection($roles);
    }

    /**
     * Enabled, non-deleted roles for selection inputs.
     */
    public function enabled(): JsonResponse
    {
        return response()->json([
            'data' => $this->roles->enabled(),
        ]);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->service->create($request->validated());

        return RoleResource::make($role)
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateRoleRequest $request, Role $role): RoleResource
    {
        $role = $this->service->update($role, $request->validated());

        return RoleResource::make($role);
    }

    public function toggle(Role $role): RoleResource
    {
        return RoleResource::make($this->service->toggle($role));
    }

    public function destroy(Role $role): JsonResponse
    {
        $this->service->delete($role);

        return response()->json(['message' => 'Role deleted.']);
    }

    /**
     * The module/permission matrix for the "Manage Permissions" drawer.
     */
    public function permissions(Role $role): JsonResponse
    {
        return response()->json(['data' => $this->rolePermissions->matrix($role)]);
    }

    /**
     * Persist module access + permission grants for the role.
     */
    public function savePermissions(SaveRolePermissionsRequest $request, Role $role): JsonResponse
    {
        $this->rolePermissions->save($role, $request->validated()['modules']);

        return response()->json(['message' => 'Permissions saved.']);
    }
}
