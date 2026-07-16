<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\PurchasePayment;
use App\Repositories\Contracts\PurchasePaymentRepositoryInterface;
use Illuminate\Validation\ValidationException;

class PurchasePaymentService
{
    public function __construct(private readonly PurchasePaymentRepositoryInterface $payments) {}

    /**
     * Record a payment against an order, refusing to pay more than it is worth.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function create(PurchaseOrder $order, array $data): PurchasePayment
    {
        $paid = (float) $this->payments->paidTotal($order);
        $balance = round((float) $order->grand_total - $paid, 2);

        if ((float) $data['amount'] > $balance) {
            throw ValidationException::withMessages([
                'amount' => "This exceeds the outstanding balance of {$balance}.",
            ]);
        }

        return $this->payments->create([...$data, 'purchase_order_id' => $order->id]);
    }

    public function delete(PurchasePayment $payment): void
    {
        $this->payments->delete($payment);
    }
}
