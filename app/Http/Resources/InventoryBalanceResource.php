<?php

namespace App\Http\Resources;

use App\Models\InventoryBalance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin InventoryBalance
 */
class InventoryBalanceResource extends JsonResource
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
            'warehouse_id' => $this->warehouse_id,
            'warehouse' => $this->whenLoaded('warehouse', fn () => $this->warehouse ? [
                'id' => $this->warehouse->id,
                'name' => $this->warehouse->name,
            ] : null),
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'reorder_level' => $this->product->reorder_level,
            ] : null),
            'product_variant_id' => $this->product_variant_id,
            'variant' => $this->whenLoaded('variant', fn () => $this->variant ? [
                'id' => $this->variant->id,
                'variant_name' => $this->variant->variant_name,
            ] : null),
            'quantity_on_hand' => $this->quantity_on_hand,
            'quantity_reserved' => $this->quantity_reserved,
            // Generated column: on_hand - reserved.
            'quantity_available' => $this->quantity_available,
            'average_cost' => $this->average_cost,
            'last_counted_at' => $this->last_counted_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
