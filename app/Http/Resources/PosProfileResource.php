<?php

namespace App\Http\Resources;

use App\Models\PosProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PosProfile
 */
class PosProfileResource extends JsonResource
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
            'company_id' => $this->company_id,
            'company' => $this->whenLoaded('company', fn () => $this->company ? [
                'id' => $this->company->id,
                'name' => $this->company->name,
            ] : null),
            'name' => $this->name,
            'code' => $this->code,
            'picking_mode' => $this->picking_mode,
            'order_types' => $this->order_types,
            'default_order_type' => $this->default_order_type,
            'quick_tender' => $this->quick_tender,
            'require_customer' => $this->require_customer,
            'allow_held_orders' => $this->allow_held_orders,
            'allow_negative_stock' => $this->allow_negative_stock,
            'is_default' => $this->is_default,
            'status' => $this->status,
            'registers_count' => $this->whenCounted('registers'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
