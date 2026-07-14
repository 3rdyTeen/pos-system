<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $service,
        private readonly UserRepositoryInterface $users,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $users = $this->users->paginate($request->only([
            'search', 'status', 'role_id', 'sort', 'direction', 'per_page',
        ]));

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->service->create(
            $request->safe()->except('image'),
            $request->file('image'),
        );

        return UserResource::make($user->load('role'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user = $this->service->update(
            $user,
            $request->safe()->except('image'),
            $request->file('image'),
        );

        return UserResource::make($user->load('role'));
    }

    public function toggle(User $user): UserResource
    {
        return UserResource::make($this->service->toggle($user)->load('role'));
    }

    public function destroy(User $user): JsonResponse
    {
        $this->service->delete($user);

        return response()->json(['message' => 'User deleted.']);
    }
}
