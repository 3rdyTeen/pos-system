<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Product
 */
class ProductResource extends JsonResource
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
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'name' => $this->name,
            'sku' => $this->sku,
            'description' => $this->description,
            'brand' => $this->brand,
            'base_unit_id' => $this->base_unit_id,
            'base_unit' => $this->whenLoaded('baseUnit', fn () => $this->baseUnit ? [
                'id' => $this->baseUnit->id,
                'name' => $this->baseUnit->name,
            ] : null),
            'tax_id' => $this->tax_id,
            'tax' => $this->whenLoaded('tax', fn () => $this->tax ? [
                'id' => $this->tax->id,
                'name' => $this->tax->name,
            ] : null),
            'cost_price' => $this->cost_price,
            'selling_price' => $this->selling_price,
            'reorder_level' => $this->reorder_level,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
