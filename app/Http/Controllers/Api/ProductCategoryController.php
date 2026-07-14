<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductCategory\StoreProductCategoryRequest;
use App\Http\Requests\ProductCategory\UpdateProductCategoryRequest;
use App\Http\Resources\ProductCategoryResource;
use App\Models\ProductCategory;
use App\Repositories\Contracts\ProductCategoryRepositoryInterface;
use App\Services\ProductCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductCategoryController extends Controller
{
    public function __construct(
        private readonly ProductCategoryService $service,
        private readonly ProductCategoryRepositoryInterface $categories,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $categories = $this->categories->paginate($request->only([
            'search', 'status', 'company_id', 'sort', 'direction', 'per_page',
        ]));

        return ProductCategoryResource::collection($categories);
    }

    /**
     * Categories for selection inputs.
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->categories->options($request->query('company_id')),
        ]);
    }

    public function store(StoreProductCategoryRequest $request): JsonResponse
    {
        $category = $this->service->create($request->validated());

        return ProductCategoryResource::make($category->load(['company', 'parent']))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductCategoryRequest $request, ProductCategory $productCategory): ProductCategoryResource
    {
        $category = $this->service->update($productCategory, $request->validated());

        return ProductCategoryResource::make($category->load(['company', 'parent']));
    }

    public function destroy(ProductCategory $productCategory): JsonResponse
    {
        $this->service->delete($productCategory);

        return response()->json(['message' => 'Category deleted.']);
    }
}
