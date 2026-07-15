<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $service,
        private readonly CustomerRepositoryInterface $customers,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $customers = $this->customers->paginate($request->only([
            'search', 'status', 'company_id', 'customer_group_id', 'sort', 'direction', 'per_page',
        ]));

        return CustomerResource::collection($customers);
    }

    /**
     * Customers for selection inputs.
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->customers->options($request->query('company_id')),
        ]);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->service->create($request->validated());

        return CustomerResource::make($customer->load(['company', 'group']))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $customer = $this->service->update($customer, $request->validated());

        return CustomerResource::make($customer->load(['company', 'group']));
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->service->delete($customer);

        return response()->json(['message' => 'Customer deleted.']);
    }
}
