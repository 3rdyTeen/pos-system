<?php

namespace App\Repositories\Eloquent;

use App\Models\ProductBarcode;
use App\Repositories\Contracts\ProductBarcodeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ProductBarcodeRepository implements ProductBarcodeRepositoryInterface
{
    /**
     * All barcodes for a product.
     *
     * @return Collection<int, ProductBarcode>
     */
    public function forProduct(string $productId): Collection
    {
        return ProductBarcode::query()
            ->with(['variant:id,variant_name', 'productUnit:id,unit_id', 'productUnit.unit:id,name'])
            ->where('product_id', $productId)
            ->get();
    }

    public function findById(string $id): ?ProductBarcode
    {
        return ProductBarcode::query()->find($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductBarcode
    {
        return ProductBarcode::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductBarcode $barcode, array $data): ProductBarcode
    {
        $barcode->update($data);

        return $barcode;
    }

    public function delete(ProductBarcode $barcode): void
    {
        $barcode->delete();
    }

    public function unsetPrimaryForProduct(string $productId, ?string $exceptId = null): void
    {
        ProductBarcode::query()
            ->where('product_id', $productId)
            ->when($exceptId, fn ($query, string $id) => $query->where('id', '!=', $id))
            ->update(['is_primary' => false]);
    }
}
