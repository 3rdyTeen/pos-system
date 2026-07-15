<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\CustomerGroupRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer groups are not managed from the UI yet; this only backs the group
 * dropdown on the customer form.
 */
class CustomerGroupController extends Controller
{
    public function __construct(private readonly CustomerGroupRepositoryInterface $groups) {}

    /**
     * Groups for selection inputs.
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->groups->options($request->query('company_id')),
        ]);
    }
}
