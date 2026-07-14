<?php

namespace App\Http\Resources;

use App\Models\Navigation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Navigation
 */
class NavigationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'module_id' => $this->module_id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'code' => $this->code,
            'icon' => $this->icon,
            'url' => $this->url,
            'order' => $this->order,
            'module' => $this->whenLoaded('module', fn () => [
                'id' => $this->module->id,
                'name' => $this->module->name,
                'code' => $this->module->code,
            ]),
            'parent' => $this->whenLoaded('parent', fn () => $this->parent ? [
                'id' => $this->parent->id,
                'name' => $this->parent->name,
            ] : null),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
