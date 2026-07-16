<?php

namespace App\Repositories\Eloquent;

use App\Models\PurchaseOrder;
use App\Models\PurchasePayment;
use App\Repositories\Contracts\PurchasePaymentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class PurchasePaymentRepository implements PurchasePaymentRepositoryInterface
{
    /**
     * @return Collection<int, PurchasePayment>
     */
    public function forOrder(string $purchaseOrderId): Collection
    {
        return PurchasePayment::query()
            ->with(['paymentMethod:id,name', 'paidBy:id,name'])
            ->where('purchase_order_id', $purchaseOrderId)
            ->orderByDesc('paid_at')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PurchasePayment
    {
        return PurchasePayment::query()->create($data);
    }

    public function delete(PurchasePayment $payment): void
    {
        $payment->delete();
    }

    public function paidTotal(PurchaseOrder $order): string
    {
        return (string) ($order->payments()->sum('amount') ?? 0);
    }
}
