<?php

namespace App\Http\Resources;

use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseOrder
 */
class PurchaseOrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // SUM() over no payments is NULL, which is indistinguishable from "the query
        // never aggregated" by value alone — so check whether the attribute is present.
        // Otherwise an unpaid order would omit paid_total/balance instead of reporting 0.
        $aggregated = array_key_exists('paid_total', $this->resource->getAttributes());
        $paid = $aggregated ? (float) ($this->paid_total ?? 0) : null;

        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
            ] : null),
            'warehouse_id' => $this->warehouse_id,
            'warehouse' => $this->whenLoaded('warehouse', fn () => $this->warehouse ? [
                'id' => $this->warehouse->id,
                'name' => $this->warehouse->name,
            ] : null),
            'supplier_id' => $this->supplier_id,
            'supplier' => $this->whenLoaded('supplier', fn () => $this->supplier ? [
                'id' => $this->supplier->id,
                'name' => $this->supplier->name,
            ] : null),
            'user_id' => $this->user_id,
            'po_number' => $this->po_number,
            'order_date' => $this->order_date?->toDateString(),
            'expected_date' => $this->expected_date?->toDateString(),
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'grand_total' => $this->grand_total,
            'status' => $this->status,
            'notes' => $this->notes,
            'details_count' => $this->whenCounted('details'),
            'details' => PurchaseDetailResource::collection($this->whenLoaded('details')),
            'payments' => PurchasePaymentResource::collection($this->whenLoaded('payments')),
            // Present when the query summed the payments (list) or loaded them (detail).
            'paid_total' => $this->when($paid !== null, fn () => number_format($paid ?? 0, 2, '.', '')),
            'balance' => $this->when($paid !== null, fn () => number_format((float) $this->grand_total - ($paid ?? 0), 2, '.', '')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
