<?php

namespace App\Http\Resources;

use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Shift
 */
class ShiftResource extends JsonResource
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
            'register_id' => $this->register_id,
            'register' => $this->whenLoaded('register', fn () => $this->register ? [
                'id' => $this->register->id,
                'name' => $this->register->name,
            ] : null),
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ] : null),
            'opening_balance' => $this->opening_balance,
            'closing_balance' => $this->closing_balance,
            'opened_at' => $this->opened_at?->toISOString(),
            'closed_at' => $this->closed_at?->toISOString(),
            'status' => $this->status,
            'notes' => $this->notes,
            // Till figures are not here: they are computed, not stored, so the
            // controller returns them alongside this resource rather than pretending
            // they are attributes of the row.
        ];
    }
}
