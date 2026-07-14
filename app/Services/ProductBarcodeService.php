<?php

namespace App\Services;

use App\Models\ProductBarcode;
use App\Repositories\Contracts\ProductBarcodeRepositoryInterface;

class ProductBarcodeService
{
    public function __construct(private readonly ProductBarcodeRepositoryInterface $barcodes) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductBarcode
    {
        $barcode = $this->barcodes->create($data);

        $this->enforceSinglePrimary($barcode);

        return $barcode;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductBarcode $barcode, array $data): ProductBarcode
    {
        $barcode = $this->barcodes->update($barcode, $data);

        $this->enforceSinglePrimary($barcode);

        return $barcode;
    }

    public function delete(ProductBarcode $barcode): void
    {
        $this->barcodes->delete($barcode);
    }

    /**
     * A product may only have one primary barcode; clear the flag from the others.
     */
    private function enforceSinglePrimary(ProductBarcode $barcode): void
    {
        if ($barcode->is_primary) {
            $this->barcodes->unsetPrimaryForProduct($barcode->product_id, $barcode->id);
        }
    }
}
