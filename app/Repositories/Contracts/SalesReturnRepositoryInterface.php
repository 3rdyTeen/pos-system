<?php

namespace App\Repositories\Contracts;

use App\Models\Sale;
use App\Models\SalesReturn;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SalesReturnRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, SalesReturn>
     */
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?SalesReturn;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): SalesReturn;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(SalesReturn $return, array $data): SalesReturn;

    public function delete(SalesReturn $return): void;

    /**
     * @param  list<array<string, mixed>>  $details
     */
    public function syncDetails(SalesReturn $return, array $details): void;

    /**
     * The return's lines as plain arrays, for posting stock without reloading.
     *
     * @return list<array<string, mixed>>
     */
    public function detailRows(SalesReturn $return): array;

    /**
     * How much of each sale line has already been returned, keyed by sales_detail_id.
     *
     * Only completed returns count — a pending one has not given anything back yet,
     * so it must not consume the returnable quantity.
     *
     * @param  SalesReturn|null  $excluding  Return being edited, whose own lines should
     *                                       not count against the cap.
     * @return array<string, float>
     */
    public function returnedQuantities(Sale $sale, ?SalesReturn $excluding = null): array;

    public function latestNumber(string $prefix): ?string;
}
