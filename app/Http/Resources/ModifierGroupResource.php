<?php

namespace App\Http\Resources;

use App\Models\ModifierGroup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ModifierGroup
 */
class ModifierGroupResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        [$min, $max] = $this->resource->selectionBounds();

        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'selection_type' => $this->selection_type,
            'is_required' => $this->is_required,
            'min_select' => $this->min_select,
            'max_select' => $this->max_select,
            // The effective bounds after the single/required rules are applied, so the
            // terminal does not have to restate them.
            'effective_min' => $min,
            'effective_max' => $max,
            'sort_order' => $this->sort_order,
            'status' => $this->status,
            'options_count' => $this->whenCounted('options'),
            'products_count' => $this->whenCounted('products'),
            'options' => $this->whenLoaded('options', fn () => $this->options->map(fn ($option) => [
                'id' => $option->id,
                'name' => $option->name,
                'price_delta' => $option->price_delta,
                'product_id' => $option->product_id,
                'is_default' => $option->is_default,
                'sort_order' => $option->sort_order,
            ])),
            'product_ids' => $this->whenLoaded('products', fn () => $this->products->pluck('id')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
