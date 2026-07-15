<?php

namespace App\Http\Resources;

use App\Models\StockTransferDetail;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockTransferDetail
 */
class StockTransferDetailResource extends JsonResource
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
            'stock_transfer_id' => $this->stock_transfer_id,
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
            ] : null),
            'product_variant_id' => $this->product_variant_id,
            'variant' => $this->whenLoaded('variant', fn () => $this->variant ? [
                'id' => $this->variant->id,
                'variant_name' => $this->variant->variant_name,
            ] : null),
            'quantity' => $this->quantity,
            'unit_cost' => $this->unit_cost,
        ];
    }
}
