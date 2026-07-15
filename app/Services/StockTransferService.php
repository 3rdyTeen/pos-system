<?php

namespace App\Services;

use App\Models\StockTransfer;
use App\Repositories\Contracts\StockTransferRepositoryInterface;
use Illuminate\Support\Facades\DB;

/**
 * Stock transfers record a movement of stock between two warehouses.
 *
 * Note: completing a transfer does not yet post to stock_movements or move
 * inventory_balances — these records are captured but do not move stock.
 */
class StockTransferService
{
    private const PREFIX = 'TRF-';

    public function __construct(private readonly StockTransferRepositoryInterface $transfers) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $details
     */
    public function create(array $data, array $details): StockTransfer
    {
        return DB::transaction(function () use ($data, $details) {
            $data['transfer_number'] ??= $this->nextNumber();

            $transfer = $this->transfers->create($data);
            $this->transfers->syncDetails($transfer, $details);

            return $transfer;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>|null  $details  Null leaves the lines untouched.
     */
    public function update(StockTransfer $transfer, array $data, ?array $details = null): StockTransfer
    {
        return DB::transaction(function () use ($transfer, $data, $details) {
            $transfer = $this->transfers->update($transfer, $data);

            if ($details !== null) {
                $this->transfers->syncDetails($transfer, $details);
            }

            return $transfer;
        });
    }

    public function delete(StockTransfer $transfer): void
    {
        DB::transaction(fn () => $this->transfers->delete($transfer));
    }

    /**
     * Next document number in the TRF-000001 sequence. Zero padding keeps the
     * numbers sortable as strings, which is what the lookup relies on.
     */
    private function nextNumber(): string
    {
        $latest = $this->transfers->latestNumber(self::PREFIX);
        $sequence = $latest ? ((int) substr($latest, strlen(self::PREFIX))) + 1 : 1;

        return self::PREFIX.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
