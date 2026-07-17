<?php

namespace App\Http\Resources;

use App\Models\SalesReturn;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SalesReturn
 */
class SalesReturnResource extends JsonResource
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
            'sale_id' => $this->sale_id,
            'sale' => $this->whenLoaded('sale', fn () => $this->sale ? [
                'id' => $this->sale->id,
                'sale_number' => $this->sale->sale_number,
                'customer' => $this->sale->relationLoaded('customer') && $this->sale->customer ? [
                    'id' => $this->sale->customer->id,
                    'name' => $this->sale->customer->name,
                ] : null,
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
            /** Computed server-side from the original sale's prices. */
            'total_amount' => $this->total_amount,
            'refund_method' => $this->refund_method,
            'status' => $this->status,
            'details_count' => $this->whenCounted('details'),
            'details' => SalesReturnDetailResource::collection($this->whenLoaded('details')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
