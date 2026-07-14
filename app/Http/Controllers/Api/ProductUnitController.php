<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductUnit\StoreProductUnitRequest;
use App\Http\Requests\ProductUnit\UpdateProductUnitRequest;
use App\Http\Resources\ProductUnitResource;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Repositories\Contracts\ProductUnitRepositoryInterface;
use App\Services\ProductUnitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductUnitController extends Controller
{
    public function __construct(
        private readonly ProductUnitService $service,
        private readonly ProductUnitRepositoryInterface $productUnits,
    ) {}

    public function index(Product $product): AnonymousResourceCollection
    {
        return ProductUnitResource::collection($this->productUnits->forProduct($product->id));
    }

    public function store(StoreProductUnitRequest $request, Product $product): JsonResponse
    {
        $productUnit = $this->service->create([...$request->validated(), 'product_id' => $product->id]);

        return ProductUnitResource::make($productUnit->load('unit'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductUnitRequest $request, ProductUnit $productUnit): ProductUnitResource
    {
        $productUnit = $this->service->update($productUnit, $request->validated());

        return ProductUnitResource::make($productUnit->load('unit'));
    }

    public function destroy(ProductUnit $productUnit): JsonResponse
    {
        $this->service->delete($productUnit);

        return response()->json(['message' => 'Unit removed.']);
    }
}
