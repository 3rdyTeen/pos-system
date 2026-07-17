<?php

namespace App\Http\Resources;

use App\Models\SalesReturnDetail;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SalesReturnDetail
 */
class SalesReturnDetailResource extends JsonResource
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
            'sales_return_id' => $this->sales_return_id,
            'sales_detail_id' => $this->sales_detail_id,
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
            ] : null),
            'product_variant_id' => $this->product_variant_id,
            'quantity' => $this->quantity,
            /** Taken from the original sale line: a refund pays back what was charged. */
            'unit_price' => $this->unit_price,
            'line_total' => $this->line_total,
        ];
    }
}
