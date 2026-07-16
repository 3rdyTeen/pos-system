<?php

namespace App\Http\Resources;

use App\Models\PurchaseReturnDetail;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseReturnDetail
 */
class PurchaseReturnDetailResource extends JsonResource
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
            'purchase_return_id' => $this->purchase_return_id,
            'purchase_detail_id' => $this->purchase_detail_id,
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
            // Computed by PurchaseReturnService, not by the database.
            'line_total' => $this->line_total,
        ];
    }
}
