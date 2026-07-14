<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductBarcode\StoreProductBarcodeRequest;
use App\Http\Requests\ProductBarcode\UpdateProductBarcodeRequest;
use App\Http\Resources\ProductBarcodeResource;
use App\Models\Product;
use App\Models\ProductBarcode;
use App\Repositories\Contracts\ProductBarcodeRepositoryInterface;
use App\Services\ProductBarcodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductBarcodeController extends Controller
{
    public function __construct(
        private readonly ProductBarcodeService $service,
        private readonly ProductBarcodeRepositoryInterface $barcodes,
    ) {}

    public function index(Product $product): AnonymousResourceCollection
    {
        return ProductBarcodeResource::collection($this->barcodes->forProduct($product->id));
    }

    public function store(StoreProductBarcodeRequest $request, Product $product): JsonResponse
    {
        $barcode = $this->service->create([...$request->validated(), 'product_id' => $product->id]);

        return ProductBarcodeResource::make($barcode->load(['variant', 'productUnit.unit']))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductBarcodeRequest $request, ProductBarcode $productBarcode): ProductBarcodeResource
    {
        $barcode = $this->service->update($productBarcode, $request->validated());

        return ProductBarcodeResource::make($barcode->load(['variant', 'productUnit.unit']));
    }

    public function destroy(ProductBarcode $productBarcode): JsonResponse
    {
        $this->service->delete($productBarcode);

        return response()->json(['message' => 'Barcode deleted.']);
    }
}
