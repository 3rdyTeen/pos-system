<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $service,
        private readonly ProductRepositoryInterface $products,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $products = $this->products->paginate($request->only([
            'search', 'status', 'company_id', 'category_id', 'sort', 'direction', 'per_page',
        ]));

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->service->create($request->validated());

        return ProductResource::make($product->load(['company', 'category', 'baseUnit', 'tax']))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product = $this->service->update($product, $request->validated());

        return ProductResource::make($product->load(['company', 'category', 'baseUnit', 'tax']));
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->service->delete($product);

        return response()->json(['message' => 'Product deleted.']);
    }
}
