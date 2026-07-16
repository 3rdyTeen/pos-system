<?php

namespace App\Services;

use App\Models\PurchaseReturn;
use App\Repositories\Contracts\PurchaseReturnRepositoryInterface;
use Illuminate\Support\Facades\DB;

/**
 * Returns of goods to a supplier against a purchase order.
 *
 * As with purchase orders, `line_total` and `total_amount` are plain columns, so the
 * service computes them from the submitted lines.
 *
 * Note: a return does not post to stock_movements or inventory_balances — it does not
 * yet move stock.
 */
class PurchaseReturnService
{
    private const PREFIX = 'PR-';

    public function __construct(private readonly PurchaseReturnRepositoryInterface $returns) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $details
     */
    public function create(array $data, array $details): PurchaseReturn
    {
        return DB::transaction(function () use ($data, $details) {
            [$lines, $total] = $this->price($details);

            $data['return_number'] ??= $this->nextNumber();
            $return = $this->returns->create([...$data, 'total_amount' => $total]);
            $this->returns->syncDetails($return, $lines);

            return $return;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>|null  $details  Null leaves the lines and total untouched.
     */
    public function update(PurchaseReturn $return, array $data, ?array $details = null): PurchaseReturn
    {
        return DB::transaction(function () use ($return, $data, $details) {
            if ($details !== null) {
                [$lines, $total] = $this->price($details);
                $data['total_amount'] = $total;
            }

            $return = $this->returns->update($return, $data);

            if ($details !== null) {
                $this->returns->syncDetails($return, $lines);
            }

            return $return;
        });
    }

    public function delete(PurchaseReturn $return): void
    {
        DB::transaction(fn () => $this->returns->delete($return));
    }

    /**
     * Compute each line's total and the return total.
     *
     * @param  list<array<string, mixed>>  $details
     * @return array{0: list<array<string, mixed>>, 1: float}
     */
    private function price(array $details): array
    {
        $lines = [];
        $total = 0.0;

        foreach ($details as $detail) {
            $lineTotal = round((float) $detail['quantity'] * (float) $detail['unit_cost'], 2);

            $lines[] = [...$detail, 'line_total' => $lineTotal];
            $total += $lineTotal;
        }

        return [$lines, round($total, 2)];
    }

    /**
     * Next document number in the PR-000001 sequence. Zero padding keeps the numbers
     * sortable as strings, which is what the lookup relies on.
     */
    private function nextNumber(): string
    {
        $latest = $this->returns->latestNumber(self::PREFIX);
        $sequence = $latest ? ((int) substr($latest, strlen(self::PREFIX))) + 1 : 1;

        return self::PREFIX.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
