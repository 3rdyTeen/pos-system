<?php

namespace App\Http\Resources;

use App\Models\PurchasePayment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchasePayment
 */
class PurchasePaymentResource extends JsonResource
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
            'purchase_order_id' => $this->purchase_order_id,
            'payment_method_id' => $this->payment_method_id,
            'payment_method' => $this->whenLoaded('paymentMethod', fn () => $this->paymentMethod ? [
                'id' => $this->paymentMethod->id,
                'name' => $this->paymentMethod->name,
            ] : null),
            'amount' => $this->amount,
            'reference_number' => $this->reference_number,
            'paid_at' => $this->paid_at?->toISOString(),
            'paid_by' => $this->paid_by,
            'paid_by_user' => $this->whenLoaded('paidBy', fn () => $this->paidBy ? [
                'id' => $this->paidBy->id,
                'name' => $this->paidBy->name,
            ] : null),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
