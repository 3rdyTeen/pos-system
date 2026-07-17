<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SalesReturn;
use App\Repositories\Contracts\SalesReturnRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Refunds against a completed sale.
 *
 * A return puts stock back and is capped at what was actually sold: each line is
 * checked against its sale line, net of anything already returned, so a customer
 * cannot be refunded twice for the same item.
 */
class SalesReturnService
{
    private const PREFIX = 'SR-';

    /**
     * Returned goods come back into the warehouse the sale drew them from.
     */
    private const MOVEMENT_BACK = 'return_in';

    public function __construct(
        private readonly SalesReturnRepositoryInterface $returns,
        private readonly StockPostingService $stock,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $lines
     *
     * @throws ValidationException
     */
    public function create(array $data, array $lines): SalesReturn
    {
        $sale = Sale::query()->with('details')->findOrFail($data['sale_id']);

        $this->assertReturnable($sale);

        return DB::transaction(function () use ($sale, $data, $lines) {
            [$details, $total] = $this->price($sale, $lines);

            $data['return_number'] ??= $this->nextNumber();
            $data['branch_id'] ??= $sale->branch_id;
            $data['total_amount'] = $total;
            $data['return_date'] ??= now()->toDateString();

            $return = $this->returns->create($data);
            $this->returns->syncDetails($return, $details);

            if (($data['status'] ?? 'completed') === 'completed') {
                $this->postStock($sale, $return, $details);
            }

            return $return;
        });
    }

    /**
     * Amend a return that has not yet been actioned.
     *
     * A completed return has already moved stock and refunded money, so its lines
     * are frozen; correcting one means cancelling it and raising another.
     *
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>|null  $lines
     *
     * @throws ValidationException
     */
    public function update(SalesReturn $return, array $data, ?array $lines = null): SalesReturn
    {
        if ($return->status === 'completed') {
            throw ValidationException::withMessages([
                'status' => 'A completed return can no longer be edited. Cancel it and raise a new one.',
            ]);
        }

        $sale = $return->sale()->with('details')->firstOrFail();

        return DB::transaction(function () use ($return, $sale, $data, $lines) {
            if ($lines !== null) {
                [$details, $total] = $this->price($sale, $lines, $return);
                $data['total_amount'] = $total;
            }

            $wasPending = $return->status !== 'completed';
            $return = $this->returns->update($return, $data);

            if ($lines !== null) {
                $this->returns->syncDetails($return, $details);
            }

            // Moving a pending return to completed is what releases the stock.
            if ($wasPending && $return->status === 'completed') {
                $this->postStock($sale, $return, $this->returns->detailRows($return));
            }

            return $return;
        });
    }

    /**
     * @throws ValidationException
     */
    public function delete(SalesReturn $return): void
    {
        if ($return->status === 'completed') {
            throw ValidationException::withMessages([
                'sales_return' => 'A completed return cannot be deleted because it has already moved stock and refunded money.',
            ]);
        }

        DB::transaction(fn () => $this->returns->delete($return));
    }

    /**
     * Put the returned goods back on the shelf.
     *
     * @param  list<array<string, mixed>>  $details
     */
    private function postStock(Sale $sale, SalesReturn $return, array $details): void
    {
        if ($sale->warehouse_id === null) {
            throw ValidationException::withMessages([
                'sale_id' => 'The original sale has no warehouse, so its stock cannot be returned.',
            ]);
        }

        foreach ($details as $detail) {
            $this->stock->post(
                warehouseId: $sale->warehouse_id,
                productId: $detail['product_id'],
                productVariantId: $detail['product_variant_id'] ?? null,
                movementType: self::MOVEMENT_BACK,
                // Positive: the goods are coming back in.
                quantity: (float) $detail['quantity'],
                referenceType: 'sales_return',
                referenceId: $return->id,
                userId: $return->user_id,
                // Stock returning can never take a balance below zero.
                allowNegative: true,
            );
        }
    }

    /**
     * Price the returned lines against the original sale.
     *
     * The unit price is taken from the sale line, never the request: a refund pays
     * back what was charged, not what the item costs today.
     *
     * @param  list<array<string, mixed>>  $lines
     * @param  SalesReturn|null  $excluding  Return being edited, so its own existing
     *                                       lines do not count against the cap.
     * @return array{0: list<array<string, mixed>>, 1: float}
     *
     * @throws ValidationException
     */
    private function price(Sale $sale, array $lines, ?SalesReturn $excluding = null): array
    {
        $saleLines = $sale->details->keyBy('id');
        $alreadyReturned = $this->returns->returnedQuantities($sale, $excluding);

        $details = [];
        $total = 0.0;

        foreach ($lines as $index => $line) {
            $saleLine = $saleLines->get($line['sales_detail_id'] ?? '');

            if (! $saleLine) {
                throw ValidationException::withMessages([
                    "lines.{$index}.sales_detail_id" => 'This line does not belong to the sale being returned.',
                ]);
            }

            $quantity = (float) $line['quantity'];
            $returnable = round((float) $saleLine->quantity - ($alreadyReturned[$saleLine->id] ?? 0), 4);

            if ($quantity > $returnable) {
                throw ValidationException::withMessages([
                    "lines.{$index}.quantity" => $returnable <= 0
                        ? 'This line has already been fully returned.'
                        : "Only {$returnable} of this line can still be returned.",
                ]);
            }

            $unitPrice = round((float) $saleLine->unit_price, 2);
            $lineTotal = round($quantity * $unitPrice, 2);

            $details[] = [
                'sales_detail_id' => $saleLine->id,
                'product_id' => $saleLine->product_id,
                'product_variant_id' => $saleLine->product_variant_id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'line_total' => $lineTotal,
            ];

            $total += $lineTotal;
        }

        if ($details === []) {
            throw ValidationException::withMessages([
                'lines' => 'A return needs at least one line.',
            ]);
        }

        return [$details, round($total, 2)];
    }

    /**
     * @throws ValidationException
     */
    private function assertReturnable(Sale $sale): void
    {
        if ($sale->status !== 'completed') {
            throw ValidationException::withMessages([
                'sale_id' => "A {$sale->status} sale cannot be returned against. Only a completed sale can.",
            ]);
        }
    }

    /**
     * Next document number in the SR-000001 sequence.
     */
    private function nextNumber(): string
    {
        $latest = $this->returns->latestNumber(self::PREFIX);
        $sequence = $latest ? ((int) substr($latest, strlen(self::PREFIX))) + 1 : 1;

        return self::PREFIX.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
