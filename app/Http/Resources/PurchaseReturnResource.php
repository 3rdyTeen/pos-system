<?php

namespace App\Http\Resources;

use App\Models\PurchaseReturn;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseReturn
 */
class PurchaseReturnResource extends JsonResource
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
            'purchase_order' => $this->whenLoaded('purchaseOrder', fn () => $this->purchaseOrder ? [
                'id' => $this->purchaseOrder->id,
                'po_number' => $this->purchaseOrder->po_number,
                'supplier' => $this->purchaseOrder->relationLoaded('supplier') && $this->purchaseOrder->supplier
                    ? ['id' => $this->purchaseOrder->supplier->id, 'name' => $this->purchaseOrder->supplier->name]
                    : null,
            ] : null),
            'branch_id' => $this->branch_id,
            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
            ] : null),
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ] : null),
            'return_number' => $this->return_number,
            'return_date' => $this->return_date?->toDateString(),
            'reason' => $this->reason,
            'total_amount' => $this->total_amount,
            'status' => $this->status,
            'details_count' => $this->whenCounted('details'),
            'details' => PurchaseReturnDetailResource::collection($this->whenLoaded('details')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
