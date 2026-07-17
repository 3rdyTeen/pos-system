<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PurchasePayment\StorePurchasePaymentRequest;
use App\Http\Resources\PurchasePaymentResource;
use App\Models\PurchaseOrder;
use App\Models\PurchasePayment;
use App\Repositories\Contracts\PurchasePaymentRepositoryInterface;
use App\Services\PurchasePaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PurchasePaymentController extends Controller
{
    public function __construct(
        private readonly PurchasePaymentService $service,
        private readonly PurchasePaymentRepositoryInterface $payments,
    ) {}

    public function index(PurchaseOrder $purchaseOrder): AnonymousResourceCollection
    {
        return PurchasePaymentResource::collection($this->payments->forOrder($purchaseOrder->id));
    }

    public function store(StorePurchasePaymentRequest $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $data = $request->validated();
        // The payer is taken from the session, never from the payload.
        $data['paid_by'] = $request->user()->id;
        $data['paid_at'] ??= now();

        $payment = $this->service->create($purchaseOrder, $data);

        return PurchasePaymentResource::make($payment->load(['paymentMethod', 'paidBy']))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(PurchasePayment $purchasePayment): JsonResponse
    {
        $this->service->delete($purchasePayment);

        return response()->json(['message' => 'Payment deleted.']);
    }
}
