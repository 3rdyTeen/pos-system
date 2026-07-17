<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Shift;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Drawer sessions.
 *
 * A shift is what makes takings attributable: without one there is no answer to
 * "what should be in this till, and who put it there?". Sales carry a shift_id,
 * so closing a shift can compare the cash the terminal believes it took against
 * what the cashier actually counted.
 */
class ShiftService
{
    /**
     * How a cash payment method is recognised.
     *
     * `payment_methods.type` is a free-text column, so this leans on the seeded
     * convention of 'cash'. A method typed anything else is treated as non-cash and
     * simply does not affect the drawer — which is the safe way to be wrong.
     */
    private const CASH_TYPE = 'cash';

    /**
     * Open a drawer on a register.
     *
     * The shifts table has no constraint preventing two open sessions on one
     * register, so the rule is enforced here.
     *
     * @throws ValidationException
     */
    public function open(string $registerId, string $userId, float $openingBalance, ?string $notes = null): Shift
    {
        $existing = $this->openShiftFor($registerId);

        if ($existing) {
            throw ValidationException::withMessages([
                'register_id' => 'This register already has an open shift. Close it before opening another.',
            ]);
        }

        return Shift::query()->create([
            'register_id' => $registerId,
            'user_id' => $userId,
            'opening_balance' => $openingBalance,
            'opened_at' => now(),
            'status' => 'open',
            'notes' => $notes,
        ]);
    }

    /**
     * Close a drawer against a counted cash figure.
     *
     * @param  float|null  $countedCash  What the cashier physically counted. Null closes
     *                                   the shift without a count, leaving no variance to report.
     *
     * @throws ValidationException
     */
    public function close(Shift $shift, ?float $countedCash = null, ?string $notes = null): Shift
    {
        if ($shift->status !== 'open') {
            throw ValidationException::withMessages([
                'status' => 'This shift is already closed.',
            ]);
        }

        return DB::transaction(function () use ($shift, $countedCash, $notes) {
            $shift->update([
                'closing_balance' => $countedCash,
                'closed_at' => now(),
                'status' => 'closed',
                'notes' => $notes ?? $shift->notes,
            ]);

            return $shift;
        });
    }

    /**
     * The open shift on a register, if any.
     */
    public function openShiftFor(string $registerId): ?Shift
    {
        return Shift::query()
            ->where('register_id', $registerId)
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();
    }

    /**
     * What the shift took, and how far the count is out.
     *
     * Only completed sales count: a void has been unwound and a held cart was never
     * paid for, so neither belongs in a till total.
     *
     * @return array<string, mixed>
     */
    public function reconcile(Shift $shift): array
    {
        $cashTaken = (float) $this->paymentsFor($shift)
            ->whereRelation('paymentMethod', 'type', self::CASH_TYPE)
            ->sum('amount');

        $otherTaken = (float) $this->paymentsFor($shift)
            ->whereDoesntHave('paymentMethod', fn ($query) => $query->where('type', self::CASH_TYPE))
            ->sum('amount');

        $expectedCash = round((float) $shift->opening_balance + $cashTaken, 2);
        $counted = $shift->closing_balance !== null ? (float) $shift->closing_balance : null;

        return [
            'opening_balance' => round((float) $shift->opening_balance, 2),
            'cash_taken' => round($cashTaken, 2),
            'other_taken' => round($otherTaken, 2),
            'expected_cash' => $expectedCash,
            'counted_cash' => $counted,
            // Positive means the drawer is over, negative means it is short.
            'variance' => $counted === null ? null : round($counted - $expectedCash, 2),
            'sales_count' => $shift->sales()->where('status', 'completed')->count(),
        ];
    }

    /**
     * Payments taken during a shift, through its completed sales.
     *
     * @return Builder<Payment>
     */
    private function paymentsFor(Shift $shift)
    {
        return Payment::query()->whereHas(
            'sale',
            fn ($query) => $query->where('shift_id', $shift->id)->where('status', 'completed'),
        );
    }
}
