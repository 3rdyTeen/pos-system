<?php

namespace App\Repositories\Contracts;

use App\Models\PaymentMethod;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PaymentMethodRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PaymentMethod>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?PaymentMethod;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PaymentMethod;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PaymentMethod $paymentMethod, array $data): PaymentMethod;

    public function delete(PaymentMethod $paymentMethod): void;
}
