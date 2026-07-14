<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Register\StoreRegisterRequest;
use App\Http\Requests\Register\UpdateRegisterRequest;
use App\Http\Resources\RegisterResource;
use App\Models\Register;
use App\Repositories\Contracts\RegisterRepositoryInterface;
use App\Services\RegisterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RegisterController extends Controller
{
    public function __construct(
        private readonly RegisterService $service,
        private readonly RegisterRepositoryInterface $registers,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $registers = $this->registers->paginate($request->only([
            'search', 'status', 'branch_id', 'sort', 'direction', 'per_page',
        ]));

        return RegisterResource::collection($registers);
    }

    public function store(StoreRegisterRequest $request): JsonResponse
    {
        $register = $this->service->create($request->validated());

        return RegisterResource::make($register->load('branch'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateRegisterRequest $request, Register $register): RegisterResource
    {
        $register = $this->service->update($register, $request->validated());

        return RegisterResource::make($register->load('branch'));
    }

    public function destroy(Register $register): JsonResponse
    {
        $this->service->delete($register);

        return response()->json(['message' => 'Register deleted.']);
    }
}
