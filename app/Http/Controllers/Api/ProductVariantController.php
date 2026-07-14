<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductVariant\StoreProductVariantRequest;
use App\Http\Requests\ProductVariant\UpdateProductVariantRequest;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Repositories\Contracts\ProductVariantRepositoryInterface;
use App\Services\ProductVariantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductVariantController extends Controller
{
    public function __construct(
        private readonly ProductVariantService $service,
        private readonly ProductVariantRepositoryInterface $variants,
    ) {}

    public function index(Product $product): AnonymousResourceCollection
    {
        return ProductVariantResource::collection($this->variants->forProduct($product->id));
    }

    public function store(StoreProductVariantRequest $request, Product $product): JsonResponse
    {
        $variant = $this->service->create([...$request->validated(), 'product_id' => $product->id]);

        return ProductVariantResource::make($variant)
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductVariantRequest $request, ProductVariant $productVariant): ProductVariantResource
    {
        $variant = $this->service->update($productVariant, $request->validated());

        return ProductVariantResource::make($variant);
    }

    public function destroy(ProductVariant $productVariant): JsonResponse
    {
        $this->service->delete($productVariant);

        return response()->json(['message' => 'Variant deleted.']);
    }
}
