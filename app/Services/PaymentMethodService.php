<?php

namespace App\Services;

use App\Models\PaymentMethod;
use App\Repositories\Contracts\PaymentMethodRepositoryInterface;

class PaymentMethodService
{
    public function __construct(private readonly PaymentMethodRepositoryInterface $paymentMethods) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PaymentMethod
    {
        return $this->paymentMethods->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PaymentMethod $paymentMethod, array $data): PaymentMethod
    {
        return $this->paymentMethods->update($paymentMethod, $data);
    }

    public function delete(PaymentMethod $paymentMethod): void
    {
        $this->paymentMethods->delete($paymentMethod);
    }
}
