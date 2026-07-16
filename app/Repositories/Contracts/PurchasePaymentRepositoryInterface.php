<?php

namespace App\Repositories\Contracts;

use App\Models\PurchaseOrder;
use App\Models\PurchasePayment;
use Illuminate\Database\Eloquent\Collection;

interface PurchasePaymentRepositoryInterface
{
    /**
     * @return Collection<int, PurchasePayment>
     */
    public function forOrder(string $purchaseOrderId): Collection;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PurchasePayment;

    public function delete(PurchasePayment $payment): void;

    /**
     * Total already paid against the order.
     */
    public function paidTotal(PurchaseOrder $order): string;
}
