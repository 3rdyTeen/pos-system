<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ModifierGroup\StoreModifierGroupRequest;
use App\Http\Requests\ModifierGroup\UpdateModifierGroupRequest;
use App\Http\Resources\ModifierGroupResource;
use App\Models\ModifierGroup;
use App\Repositories\Contracts\ModifierGroupRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ModifierGroupController extends Controller
{
    public function __construct(private readonly ModifierGroupRepositoryInterface $groups) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $groups = $this->groups->paginate($request->only([
            'search', 'status', 'sort', 'direction', 'per_page',
        ]));

        return ModifierGroupResource::collection($groups);
    }

    /**
     * Groups for selection inputs (the product page's attach dropdown).
     */
    public function options(): JsonResponse
    {
        return response()->json(['data' => $this->groups->options()]);
    }

    public function show(ModifierGroup $modifierGroup): ModifierGroupResource
    {
        return ModifierGroupResource::make($modifierGroup->load(['options', 'products:id']));
    }

    public function store(StoreModifierGroupRequest $request): JsonResponse
    {
        $data = $request->validated();
        $options = $data['options'] ?? [];
        $productIds = $data['product_ids'] ?? null;
        unset($data['options'], $data['product_ids']);

        $group = DB::transaction(function () use ($data, $options, $productIds) {
            $group = $this->groups->create($data);
            $this->groups->syncOptions($group, $options);

            if ($productIds !== null) {
                $this->groups->syncProducts($group, $productIds);
            }

            return $group;
        });

        return ModifierGroupResource::make($group->load(['options', 'products:id']))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateModifierGroupRequest $request, ModifierGroup $modifierGroup): ModifierGroupResource
    {
        $data = $request->validated();
        // Absent means "leave them alone"; present-but-empty is rejected by the rules.
        $options = array_key_exists('options', $data) ? $data['options'] : null;
        $productIds = array_key_exists('product_ids', $data) ? $data['product_ids'] : null;
        unset($data['options'], $data['product_ids']);

        $group = DB::transaction(function () use ($modifierGroup, $data, $options, $productIds) {
            $group = $this->groups->update($modifierGroup, $data);

            if ($options !== null) {
                $this->groups->syncOptions($group, $options);
            }

            if ($productIds !== null) {
                $this->groups->syncProducts($group, $productIds);
            }

            return $group;
        });

        return ModifierGroupResource::make($group->load(['options', 'products:id']));
    }

    public function destroy(ModifierGroup $modifierGroup): JsonResponse
    {
        $this->groups->delete($modifierGroup);

        return response()->json(['message' => 'Modifier group deleted.']);
    }
}
