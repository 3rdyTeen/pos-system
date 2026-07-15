<?php

namespace App\Http\Resources;

use App\Models\StockAdjustmentDetail;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockAdjustmentDetail
 */
class StockAdjustmentDetailResource extends JsonResource
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
            'stock_adjustment_id' => $this->stock_adjustment_id,
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
            'system_qty' => $this->system_qty,
            'counted_qty' => $this->counted_qty,
            // Generated column: counted_qty - system_qty.
            'difference' => $this->difference,
            'unit_cost' => $this->unit_cost,
        ];
    }
}
