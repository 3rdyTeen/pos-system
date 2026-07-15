<?php

namespace App\Services;

use App\Models\StockAdjustment;
use App\Repositories\Contracts\StockAdjustmentRepositoryInterface;
use Illuminate\Support\Facades\DB;

/**
 * Stock adjustments record a physical count against the system quantity.
 *
 * Note: approving an adjustment does not yet post to stock_movements or correct
 * inventory_balances — these records are captured but do not move stock.
 */
class StockAdjustmentService
{
    private const PREFIX = 'ADJ-';

    public function __construct(private readonly StockAdjustmentRepositoryInterface $adjustments) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $details
     */
    public function create(array $data, array $details): StockAdjustment
    {
        return DB::transaction(function () use ($data, $details) {
            $data['adjustment_number'] ??= $this->nextNumber();

            $adjustment = $this->adjustments->create($data);
            $this->adjustments->syncDetails($adjustment, $details);

            return $adjustment;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>|null  $details  Null leaves the lines untouched.
     */
    public function update(StockAdjustment $adjustment, array $data, ?array $details = null): StockAdjustment
    {
        return DB::transaction(function () use ($adjustment, $data, $details) {
            $adjustment = $this->adjustments->update($adjustment, $data);

            if ($details !== null) {
                $this->adjustments->syncDetails($adjustment, $details);
            }

            return $adjustment;
        });
    }

    public function delete(StockAdjustment $adjustment): void
    {
        DB::transaction(fn () => $this->adjustments->delete($adjustment));
    }

    /**
     * Next document number in the ADJ-000001 sequence. Zero padding keeps the
     * numbers sortable as strings, which is what the lookup relies on.
     */
    private function nextNumber(): string
    {
        $latest = $this->adjustments->latestNumber(self::PREFIX);
        $sequence = $latest ? ((int) substr($latest, strlen(self::PREFIX))) + 1 : 1;

        return self::PREFIX.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
