<?php

namespace App\Http\Resources;

use App\Models\PurchaseDetail;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseDetail
 */
class PurchaseDetailResource extends JsonResource
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
            'purchase_order_id' => $this->purchase_order_id,
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
            'tax_amount' => $this->tax_amount,
            'discount_amount' => $this->discount_amount,
            // Computed by PurchaseOrderService, not by the database.
            'line_total' => $this->line_total,
            'received_qty' => $this->received_qty,
        ];
    }
}
