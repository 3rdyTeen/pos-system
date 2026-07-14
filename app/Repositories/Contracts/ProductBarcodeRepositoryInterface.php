<?php

namespace App\Repositories\Contracts;

use App\Models\ProductBarcode;
use Illuminate\Database\Eloquent\Collection;

interface ProductBarcodeRepositoryInterface
{
    /**
     * All barcodes for a product.
     *
     * @return Collection<int, ProductBarcode>
     */
    public function forProduct(string $productId): Collection;

    public function findById(string $id): ?ProductBarcode;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductBarcode;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductBarcode $barcode, array $data): ProductBarcode;

    public function delete(ProductBarcode $barcode): void;

    /**
     * Clear the primary flag from every barcode of a product, optionally excepting one.
     */
    public function unsetPrimaryForProduct(string $productId, ?string $exceptId = null): void;
}
