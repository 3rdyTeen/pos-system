<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PosProfile\StorePosProfileRequest;
use App\Http\Requests\PosProfile\UpdatePosProfileRequest;
use App\Http\Resources\PosProfileResource;
use App\Models\PosProfile;
use App\Repositories\Contracts\PosProfileRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PosProfileController extends Controller
{
    public function __construct(private readonly PosProfileRepositoryInterface $profiles) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $profiles = $this->profiles->paginate($request->only([
            'search', 'status', 'sort', 'direction', 'per_page',
        ]));

        return PosProfileResource::collection($profiles);
    }

    /**
     * Profiles for selection inputs (the register form's profile dropdown).
     */
    public function options(): JsonResponse
    {
        return response()->json(['data' => $this->profiles->options()]);
    }

    public function store(StorePosProfileRequest $request): JsonResponse
    {
        $profile = $this->profiles->create($request->validated());

        // At most one default per company, or resolveFor() would pick arbitrarily.
        if ($profile->is_default) {
            $this->profiles->clearDefaultExcept($profile);
        }

        return PosProfileResource::make($profile->load('company'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdatePosProfileRequest $request, PosProfile $posProfile): PosProfileResource
    {
        $profile = $this->profiles->update($posProfile, $request->validated());

        if ($profile->is_default) {
            $this->profiles->clearDefaultExcept($profile);
        }

        return PosProfileResource::make($profile->load('company'));
    }

    public function destroy(PosProfile $posProfile): JsonResponse
    {
        $this->profiles->delete($posProfile);

        return response()->json(['message' => 'POS profile deleted.']);
    }
}
