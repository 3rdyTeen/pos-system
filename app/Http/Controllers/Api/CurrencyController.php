<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Currency\StoreCurrencyRequest;
use App\Http\Requests\Currency\UpdateCurrencyRequest;
use App\Http\Resources\CurrencyResource;
use App\Models\Currency;
use App\Repositories\Contracts\CurrencyRepositoryInterface;
use App\Services\CurrencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CurrencyController extends Controller
{
    public function __construct(
        private readonly CurrencyService $service,
        private readonly CurrencyRepositoryInterface $currencies,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $currencies = $this->currencies->paginate($request->only([
            'search', 'status', 'sort', 'direction', 'per_page',
        ]));

        return CurrencyResource::collection($currencies);
    }

    public function store(StoreCurrencyRequest $request): JsonResponse
    {
        $currency = $this->service->create($request->validated());

        return CurrencyResource::make($currency)
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCurrencyRequest $request, Currency $currency): CurrencyResource
    {
        $currency = $this->service->update($currency, $request->validated());

        return CurrencyResource::make($currency);
    }

    public function destroy(Currency $currency): JsonResponse
    {
        $this->service->delete($currency);

        return response()->json(['message' => 'Currency deleted.']);
    }
}
