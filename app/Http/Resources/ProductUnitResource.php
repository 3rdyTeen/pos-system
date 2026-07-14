<?php

namespace App\Http\Resources;

use App\Models\ProductUnit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ProductUnit
 */
class ProductUnitResource extends JsonResource
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
            'product_id' => $this->product_id,
            'unit_id' => $this->unit_id,
            'unit' => $this->whenLoaded('unit', fn () => $this->unit ? [
                'id' => $this->unit->id,
                'name' => $this->unit->name,
                'abbreviation' => $this->unit->abbreviation,
            ] : null),
            'conversion_factor' => $this->conversion_factor,
            'is_base_unit' => $this->is_base_unit,
        ];
    }
}
