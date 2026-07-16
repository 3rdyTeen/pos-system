<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Repositories\Contracts\PurchaseOrderRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Purchase orders and their receiving flow.
 *
 * Unlike the inventory documents, none of the money here is a generated column:
 * `line_total` on each line and the four header totals are plain columns, so they
 * are computed from the submitted lines and written by this service. Client-supplied
 * totals are never trusted — they are not even accepted by the form requests.
 *
 * Note: receiving records `received_qty` and moves the status, but does not post to
 * stock_movements or inventory_balances — receiving does not yet move stock.
 */
class PurchaseOrderService
{
    private const PREFIX = 'PO-';

    /**
     * Statuses that cannot be received against.
     *
     * @var list<string>
     */
    private const UNRECEIVABLE = ['draft', 'cancelled'];

    public function __construct(private readonly PurchaseOrderRepositoryInterface $orders) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $details
     */
    public function create(array $data, array $details): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $details) {
            [$lines, $totals] = $this->price($details);

            $data['po_number'] ??= $this->nextNumber();
            $order = $this->orders->create([...$data, ...$totals]);
            $this->orders->syncDetails($order, $lines);

            return $order;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>|null  $details  Null leaves the lines and totals untouched.
     */
    public function update(PurchaseOrder $order, array $data, ?array $details = null): PurchaseOrder
    {
        return DB::transaction(function () use ($order, $data, $details) {
            if ($details !== null) {
                [$lines, $totals] = $this->price($details);
                $data = [...$data, ...$totals];
            }

            $order = $this->orders->update($order, $data);

            if ($details !== null) {
                $this->orders->syncDetails($order, $lines);
            }

            return $order;
        });
    }

    public function delete(PurchaseOrder $order): void
    {
        $returns = $this->orders->returnsCount($order);

        if ($returns > 0) {
            throw ValidationException::withMessages([
                'purchase_order' => "This order cannot be deleted because it has {$returns} return(s) against it.",
            ]);
        }

        DB::transaction(fn () => $this->orders->delete($order));
    }

    /**
     * Record received quantities against the order's lines and move the status on.
     *
     * @param  list<array{purchase_detail_id: string, received_qty: string|float}>  $lines
     *
     * @throws ValidationException
     */
    public function receive(PurchaseOrder $order, array $lines): PurchaseOrder
    {
        if (in_array($order->status, self::UNRECEIVABLE, true)) {
            throw ValidationException::withMessages([
                'status' => 'Only an ordered purchase order can be received against.',
            ]);
        }

        return DB::transaction(function () use ($order, $lines) {
            $details = $order->details()->get()->keyBy('id');

            foreach ($lines as $index => $line) {
                $detail = $details->get($line['purchase_detail_id']);

                if (! $detail) {
                    throw ValidationException::withMessages([
                        "lines.{$index}.purchase_detail_id" => 'This line does not belong to the purchase order.',
                    ]);
                }

                if ((float) $line['received_qty'] > (float) $detail->quantity) {
                    throw ValidationException::withMessages([
                        "lines.{$index}.received_qty" => "Cannot receive more than the ordered quantity ({$detail->quantity}).",
                    ]);
                }

                $detail->update(['received_qty' => $line['received_qty']]);
            }

            $order->setRelation('details', $order->details()->get());
            $this->orders->update($order, ['status' => $this->deriveStatus($order)]);

            return $order;
        });
    }

    /**
     * Derive the order status from how much of it has been received.
     */
    private function deriveStatus(PurchaseOrder $order): string
    {
        $details = $order->details;

        if ($details->isEmpty()) {
            return $order->status;
        }

        if ($details->every(fn ($detail) => (float) $detail->received_qty >= (float) $detail->quantity)) {
            return 'received';
        }

        return $details->contains(fn ($detail) => (float) $detail->received_qty > 0)
            ? 'partially_received'
            : 'ordered';
    }

    /**
     * Compute each line's total and the header totals.
     *
     * line_total  = quantity x unit_cost + tax - discount
     * grand_total = subtotal + tax_total - discount_total
     *
     * @param  list<array<string, mixed>>  $details
     * @return array{0: list<array<string, mixed>>, 1: array<string, float>}
     */
    private function price(array $details): array
    {
        $lines = [];
        $subtotal = 0.0;
        $taxTotal = 0.0;
        $discountTotal = 0.0;

        foreach ($details as $detail) {
            $tax = round((float) ($detail['tax_amount'] ?? 0), 2);
            $discount = round((float) ($detail['discount_amount'] ?? 0), 2);
            $gross = round((float) $detail['quantity'] * (float) $detail['unit_cost'], 2);

            $lines[] = [
                ...$detail,
                'tax_amount' => $tax,
                'discount_amount' => $discount,
                'line_total' => round($gross + $tax - $discount, 2),
            ];

            $subtotal += $gross;
            $taxTotal += $tax;
            $discountTotal += $discount;
        }

        return [$lines, [
            'subtotal' => round($subtotal, 2),
            'tax_total' => round($taxTotal, 2),
            'discount_total' => round($discountTotal, 2),
            'grand_total' => round($subtotal + $taxTotal - $discountTotal, 2),
        ]];
    }

    /**
     * Next document number in the PO-000001 sequence. Zero padding keeps the numbers
     * sortable as strings, which is what the lookup relies on.
     */
    private function nextNumber(): string
    {
        $latest = $this->orders->latestNumber(self::PREFIX);
        $sequence = $latest ? ((int) substr($latest, strlen(self::PREFIX))) + 1 : 1;

        return self::PREFIX.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
