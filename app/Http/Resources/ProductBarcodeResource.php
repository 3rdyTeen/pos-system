<?php

namespace App\Http\Resources;

use App\Models\ProductBarcode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ProductBarcode
 */
class ProductBarcodeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_variant_id' => $this->product_variant_id,
            'variant' => $this->whenLoaded('variant', fn () => $this->variant ? [
                'id' => $this->variant->id,
                'name' => $this->variant->variant_name,
            ] : null),
            'product_unit_id' => $this->product_unit_id,
            'unit' => $this->whenLoaded('productUnit', fn () => $this->productUnit && $this->productUnit->unit ? [
                'id' => $this->productUnit->id,
                'name' => $this->productUnit->unit->name,
            ] : null),
            'barcode' => $this->barcode,
            'is_primary' => $this->is_primary,
        ];
    }
}
