<?php

namespace App\Http\Resources;

use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Unit
 */
class UnitResource extends JsonResource
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
            'abbreviation' => $this->abbreviation,
            'base_unit_id' => $this->base_unit_id,
            'base_unit' => $this->whenLoaded('baseUnit', fn () => $this->baseUnit ? [
                'id' => $this->baseUnit->id,
                'name' => $this->baseUnit->name,
            ] : null),
            'conversion_factor' => $this->conversion_factor,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
