<?php

namespace App\Services;

use App\Models\InventoryBalance;
use App\Models\StockMovement;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The single writer for stock levels.
 *
 * Every other module in this codebase deliberately leaves stock alone — the
 * purchase and adjustment services say so in their own docblocks. Selling is the
 * first flow that has to move it, so the rules live here rather than in
 * SaleService, and returns/voids reuse them instead of reimplementing the maths.
 *
 * Two invariants hold this together:
 *
 * 1. `quantity` on a movement is SIGNED — negative leaves the warehouse, positive
 *    enters it. That makes SUM(quantity) per (warehouse, product, variant) equal
 *    the balance's quantity_on_hand, so the ledger can always be audited against
 *    the running total.
 * 2. Nothing is ever edited or deleted. A void posts an opposite row rather than
 *    removing the original, so history survives.
 *
 * Callers must already be inside a transaction: the balance row is locked with
 * lockForUpdate() and that lock is meaningless outside one.
 */
class StockPostingService
{
    /**
     * Apply a signed quantity to a warehouse balance and record the ledger line.
     *
     * @param  float  $quantity  Signed: negative consumes stock, positive returns it.
     * @param  bool  $allowNegative  Whether the balance may fall below zero. Groceries
     *                               and fast food generally run with this on because
     *                               counts drift; controlled retail turns it off.
     * @param  string|null  $errorKey  Validation key to hang an oversell error on, so
     *                                 the terminal can mark the offending line.
     *
     * @throws ValidationException When the posting would oversell and $allowNegative is false.
     */
    public function post(
        string $warehouseId,
        string $productId,
        ?string $productVariantId,
        string $movementType,
        float $quantity,
        string $referenceType,
        string $referenceId,
        ?string $userId = null,
        bool $allowNegative = true,
        ?string $errorKey = null,
        ?string $productName = null,
    ): StockMovement {
        $balance = $this->lockBalance($warehouseId, $productId, $productVariantId);

        $before = (float) $balance->quantity_on_hand;
        $after = round($before + $quantity, 4);

        if ($after < 0 && ! $allowNegative) {
            $label = $productName ?? 'This product';

            throw ValidationException::withMessages([
                $errorKey ?? 'stock' => "{$label} has only {$before} in stock and the terminal is not allowed to sell past zero.",
            ]);
        }

        $balance->update(['quantity_on_hand' => $after]);

        return StockMovement::query()->create([
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'product_variant_id' => $productVariantId,
            'movement_type' => $movementType,
            'quantity' => $quantity,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'before_qty' => $before,
            'after_qty' => $after,
            'created_by' => $userId,
        ]);
    }

    /**
     * Post the opposite of everything previously recorded against a reference.
     *
     * Used to unwind a sale on void. Reversals are read from the ledger rather than
     * recomputed from the sale's lines, so a sale whose lines were somehow edited
     * after posting still reverses exactly what it took.
     *
     * @param  string  $movementType  The type to file the reversing rows under.
     */
    public function reverse(
        string $referenceType,
        string $referenceId,
        string $movementType,
        ?string $userId = null,
    ): void {
        $movements = StockMovement::query()
            ->where('reference_type', $referenceType)
            ->where('reference_id', $referenceId)
            // Skip rows of the reversing type so a second call cannot reverse the
            // reversal. SaleService already refuses to void twice; this keeps the
            // posting layer safe on its own terms.
            ->whereNot('movement_type', $movementType)
            ->get();

        foreach ($movements as $movement) {
            $this->post(
                warehouseId: $movement->warehouse_id,
                productId: $movement->product_id,
                productVariantId: $movement->product_variant_id,
                movementType: $movementType,
                quantity: -1 * (float) $movement->quantity,
                referenceType: $referenceType,
                referenceId: $referenceId,
                userId: $userId,
                // A reversal returns stock, so it can never oversell.
                allowNegative: true,
            );
        }
    }

    /**
     * The balance row for a product in a warehouse, locked for the rest of the
     * transaction. Created at zero on first sight so a product that has never been
     * counted can still be sold.
     */
    private function lockBalance(string $warehouseId, string $productId, ?string $variantId): InventoryBalance
    {
        $find = fn () => InventoryBalance::query()
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->when($variantId === null,
                fn ($query) => $query->whereNull('product_variant_id'),
                fn ($query) => $query->where('product_variant_id', $variantId),
            )
            ->lockForUpdate()
            ->first();

        if ($balance = $find()) {
            return $balance;
        }

        // Two terminals can race to first-sell the same product. The loser of the
        // insert re-reads rather than failing the sale.
        try {
            return InventoryBalance::query()->create([
                'warehouse_id' => $warehouseId,
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'quantity_on_hand' => 0,
                'quantity_reserved' => 0,
            ]);
        } catch (UniqueConstraintViolationException) {
            return $find() ?? throw new \RuntimeException('Could not resolve the inventory balance row.');
        }
    }

    /**
     * Sum the ledger for a product in a warehouse. Exposed for reconciliation:
     * this must always agree with inventory_balances.quantity_on_hand.
     */
    public function ledgerBalance(string $warehouseId, string $productId, ?string $variantId = null): float
    {
        return (float) DB::table('stock_movements')
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->when($variantId === null,
                fn ($query) => $query->whereNull('product_variant_id'),
                fn ($query) => $query->where('product_variant_id', $variantId),
            )
            ->sum('quantity');
    }
}
