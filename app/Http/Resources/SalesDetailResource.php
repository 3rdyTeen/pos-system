<?php

namespace App\Http\Resources;

use App\Models\SalesDetail;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SalesDetail
 */
class SalesDetailResource extends JsonResource
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
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
            ] : null),
            'product_variant_id' => $this->product_variant_id,
            'variant' => $this->whenLoaded('variant', fn () => $this->variant ? [
                'id' => $this->variant->id,
                'name' => $this->variant->name,
            ] : null),
            'unit_id' => $this->unit_id,
            'unit' => $this->whenLoaded('unit', fn () => $this->unit ? [
                'id' => $this->unit->id,
                'name' => $this->unit->name,
            ] : null),
            'quantity' => $this->quantity,
            /** All-in: the catalogue price plus every modifier and component surcharge. */
            'unit_price' => $this->unit_price,
            'discount_amount' => $this->discount_amount,
            'tax_amount' => $this->tax_amount,
            /** Computed server-side: quantity x unit_price - discount, plus tax when the tax is not inclusive. */
            'line_total' => $this->line_total,
            'modifiers' => $this->whenLoaded('modifiers', fn () => $this->modifiers->map(fn ($modifier) => [
                'id' => $modifier->id,
                'modifier_group_id' => $modifier->modifier_group_id,
                // Needed to resume a parked cart with the same choices re-selected.
                'modifier_option_id' => $modifier->modifier_option_id,
                'group_name' => $modifier->group_name,
                'name' => $modifier->name,
                'price_delta' => $modifier->price_delta,
                'product_id' => $modifier->product_id,
            ])),
            'components' => $this->whenLoaded('components', fn () => $this->components->map(fn ($component) => [
                'id' => $component->id,
                'combo_slot_id' => $component->combo_slot_id,
                'slot_option_id' => $component->combo_slot_option_id,
                'slot_name' => $component->slot_name,
                'name' => $component->name,
                'product_id' => $component->product_id,
                'quantity' => $component->quantity,
                'price_delta' => $component->price_delta,
            ])),
        ];
    }
}
