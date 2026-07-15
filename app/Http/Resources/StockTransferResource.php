<?php

namespace App\Http\Resources;

use App\Models\StockTransfer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockTransfer
 */
class StockTransferResource extends JsonResource
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
            'from_warehouse_id' => $this->from_warehouse_id,
            'from_warehouse' => $this->whenLoaded('fromWarehouse', fn () => $this->fromWarehouse ? [
                'id' => $this->fromWarehouse->id,
                'name' => $this->fromWarehouse->name,
            ] : null),
            'to_warehouse_id' => $this->to_warehouse_id,
            'to_warehouse' => $this->whenLoaded('toWarehouse', fn () => $this->toWarehouse ? [
                'id' => $this->toWarehouse->id,
                'name' => $this->toWarehouse->name,
            ] : null),
            'transfer_number' => $this->transfer_number,
            'status' => $this->status,
            'requested_by' => $this->requested_by,
            'requested_by_user' => $this->whenLoaded('requestedBy', fn () => $this->requestedBy ? [
                'id' => $this->requestedBy->id,
                'name' => $this->requestedBy->name,
            ] : null),
            'approved_by' => $this->approved_by,
            'transfer_date' => $this->transfer_date?->toDateString(),
            'notes' => $this->notes,
            'details_count' => $this->whenCounted('details'),
            'details' => StockTransferDetailResource::collection($this->whenLoaded('details')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
