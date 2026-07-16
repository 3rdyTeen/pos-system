<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentMethod\StorePaymentMethodRequest;
use App\Http\Requests\PaymentMethod\UpdatePaymentMethodRequest;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;
use App\Repositories\Contracts\PaymentMethodRepositoryInterface;
use App\Services\PaymentMethodService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentMethodController extends Controller
{
    public function __construct(
        private readonly PaymentMethodService $service,
        private readonly PaymentMethodRepositoryInterface $paymentMethods,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $paymentMethods = $this->paymentMethods->paginate($request->only([
            'search', 'company_id', 'is_active', 'sort', 'direction', 'per_page',
        ]));

        return PaymentMethodResource::collection($paymentMethods);
    }

    /**
     * Active payment methods for selection inputs.
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->paymentMethods->options($request->query('company_id')),
        ]);
    }

    public function store(StorePaymentMethodRequest $request): JsonResponse
    {
        $paymentMethod = $this->service->create($request->validated());

        return PaymentMethodResource::make($paymentMethod->load('company'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdatePaymentMethodRequest $request, PaymentMethod $paymentMethod): PaymentMethodResource
    {
        $paymentMethod = $this->service->update($paymentMethod, $request->validated());

        return PaymentMethodResource::make($paymentMethod->load('company'));
    }

    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $this->service->delete($paymentMethod);

        return response()->json(['message' => 'Payment method deleted.']);
    }
}
