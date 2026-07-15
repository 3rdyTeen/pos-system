<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryBalanceResource;
use App\Repositories\Contracts\InventoryBalanceRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Read-only: balances are derived from stock postings, never edited by hand.
 */
class InventoryBalanceController extends Controller
{
    public function __construct(private readonly InventoryBalanceRepositoryInterface $balances) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $balances = $this->balances->paginate($request->only([
            'search', 'warehouse_id', 'product_id', 'stock', 'sort', 'direction', 'per_page',
        ]));

        return InventoryBalanceResource::collection($balances);
    }
}
