<?php

namespace App\Http\Resources;

use App\Models\StockAdjustment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockAdjustment
 */
class StockAdjustmentResource extends JsonResource
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
            'adjustment_number' => $this->adjustment_number,
            'reason' => $this->reason,
            'status' => $this->status,
            'adjusted_by' => $this->adjusted_by,
            'adjusted_by_user' => $this->whenLoaded('adjustedBy', fn () => $this->adjustedBy ? [
                'id' => $this->adjustedBy->id,
                'name' => $this->adjustedBy->name,
            ] : null),
            'adjustment_date' => $this->adjustment_date?->toDateString(),
            'notes' => $this->notes,
            'details_count' => $this->whenCounted('details'),
            'details' => StockAdjustmentDetailResource::collection($this->whenLoaded('details')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
