<?php

namespace App\Services;

use App\Models\ComboSlot;
use App\Models\ModifierGroup;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

/**
 * Turns one submitted cart line into what actually gets stored.
 *
 * This lives apart from SaleService because pricing a line stopped being a small
 * sum once modifiers and combos existed: a line now has to be validated against the
 * product's configured choices, priced from those choices, and expanded into the
 * real products it consumes. SaleService still owns the sale; this owns the line.
 *
 * Nothing here trusts the client. The terminal sends which options were picked; the
 * prices, the names and the components all come from the catalogue.
 */
class SaleLinePricer
{
    /**
     * Build a line: its detail row, the choices made against it, and the real
     * products it resolves to.
     *
     * @param  array<string, mixed>  $line
     * @param  int  $index  Position in the cart, for addressing validation errors.
     * @return array{detail: array<string, mixed>, modifiers: list<array<string, mixed>>, components: list<array<string, mixed>>, tax: array<string, mixed>|null, gross: float, discount: float}
     *
     * @throws ValidationException
     */
    public function build(Product $product, array $line, int $index, bool $modifiersEnabled, bool $combosEnabled, bool $allowPriceOverride, bool $allowDiscount): array
    {
        $quantity = (float) $line['quantity'];

        $modifiers = $this->resolveModifiers($product, $line, $index, $modifiersEnabled);
        $components = $this->resolveComponents($product, $line, $index, $combosEnabled);

        $basePrice = $this->basePrice($product, $line, $index, $allowPriceOverride);
        $deltas = array_sum(array_column($modifiers, 'price_delta'))
            + array_sum(array_column($components, 'price_delta'));

        // The stored unit price is all-in: base plus every choice. That keeps
        // line_total = quantity x unit_price - discount reconcilable on the receipt,
        // and means a refund pays back the modifiers too rather than just the base.
        $unitPrice = round($basePrice + $deltas, 2);

        if ($unitPrice < 0) {
            throw ValidationException::withMessages([
                "lines.{$index}.modifiers" => 'These choices price the line below zero.',
            ]);
        }

        $discount = $this->discount($line, $index, $allowDiscount);
        $gross = round($quantity * $unitPrice, 2);
        $net = round($gross - $discount, 2);

        if ($net < 0) {
            throw ValidationException::withMessages([
                "lines.{$index}.discount_amount" => 'A discount cannot exceed the value of the line.',
            ]);
        }

        [$taxAmount, $taxable, $lineTotal] = $this->applyTax($product, $net);

        return [
            'detail' => [
                'product_id' => $product->id,
                'product_variant_id' => $line['product_variant_id'] ?? null,
                'unit_id' => $line['unit_id'] ?? $product->base_unit_id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'discount_amount' => $discount,
                'tax_amount' => $taxAmount,
                'line_total' => $lineTotal,
            ],
            'modifiers' => $modifiers,
            'components' => $components,
            'tax' => $taxAmount > 0 && $product->tax ? [
                'tax_id' => $product->tax->id,
                // Copied in so a historical receipt survives a later rate change.
                'tax_name' => $product->tax->name,
                'rate' => (float) $product->tax->rate,
                'taxable_amount' => $taxable,
                'tax_amount' => $taxAmount,
            ] : null,
            'gross' => $gross,
            'discount' => $discount,
        ];
    }

    /**
     * The line's price before any choices are applied.
     *
     * @param  array<string, mixed>  $line
     *
     * @throws ValidationException
     */
    private function basePrice(Product $product, array $line, int $index, bool $allowPriceOverride): float
    {
        $override = $line['unit_price'] ?? null;

        if ($override === null) {
            return round((float) $product->selling_price, 2);
        }

        // A manual price is a privilege, not a given: with the control switched off
        // the catalogue price is final and a submitted override is an error rather
        // than something to quietly ignore.
        if (! $allowPriceOverride && round((float) $override, 2) !== round((float) $product->selling_price, 2)) {
            throw ValidationException::withMessages([
                "lines.{$index}.unit_price" => 'This company does not allow the price to be changed at the till.',
            ]);
        }

        return round((float) $override, 2);
    }

    /**
     * @param  array<string, mixed>  $line
     *
     * @throws ValidationException
     */
    private function discount(array $line, int $index, bool $allowDiscount): float
    {
        $discount = round((float) ($line['discount_amount'] ?? 0), 2);

        if ($discount > 0 && ! $allowDiscount) {
            throw ValidationException::withMessages([
                "lines.{$index}.discount_amount" => 'This company does not allow line discounts at the till.',
            ]);
        }

        return $discount;
    }

    /**
     * Validate the chosen options against the product's groups and price them.
     *
     * @param  array<string, mixed>  $line
     * @return list<array<string, mixed>>
     *
     * @throws ValidationException
     */
    private function resolveModifiers(Product $product, array $line, int $index, bool $enabled): array
    {
        /** @var list<string> $chosenIds */
        $chosenIds = $line['modifiers'] ?? [];

        // Active only, matching what the terminal's configuration endpoint offers.
        // If these two ever disagree, deactivating a required group would leave the
        // product unsellable: the till would not show the question while this would
        // still refuse the line for not answering it.
        $groups = ($product->relationLoaded('modifierGroups') ? $product->modifierGroups : collect())
            ->where('status', 'active');

        if ($chosenIds !== [] && ! $enabled) {
            throw ValidationException::withMessages([
                "lines.{$index}.modifiers" => 'Product modifiers are switched off for this company.',
            ]);
        }

        if (! $enabled) {
            return [];
        }

        // Index every option the product legitimately offers, so a choice from some
        // other product's group cannot be smuggled in.
        $offered = [];
        foreach ($groups as $group) {
            foreach ($group->options as $option) {
                $offered[$option->id] = [$group, $option];
            }
        }

        $resolved = [];
        $countByGroup = [];

        foreach ($chosenIds as $optionId) {
            if (! isset($offered[$optionId])) {
                throw ValidationException::withMessages([
                    "lines.{$index}.modifiers" => 'That choice is not offered on this product.',
                ]);
            }

            [$group, $option] = $offered[$optionId];
            $countByGroup[$group->id] = ($countByGroup[$group->id] ?? 0) + 1;

            $resolved[] = [
                'modifier_option_id' => $option->id,
                'modifier_group_id' => $group->id,
                // Copied so renaming or repricing the option never rewrites this receipt.
                'group_name' => $group->name,
                'name' => $option->name,
                'price_delta' => round((float) $option->price_delta, 2),
                'product_id' => $option->product_id,
            ];
        }

        foreach ($groups as $group) {
            $this->assertWithinBounds($group, $countByGroup[$group->id] ?? 0, $index);
        }

        return $resolved;
    }

    /**
     * @throws ValidationException
     */
    private function assertWithinBounds(ModifierGroup $group, int $count, int $index): void
    {
        [$min, $max] = $group->selectionBounds();

        if ($count < $min) {
            throw ValidationException::withMessages([
                "lines.{$index}.modifiers" => $min === 1
                    ? "Choose a {$group->name}."
                    : "Choose at least {$min} from {$group->name}.",
            ]);
        }

        if ($max !== null && $count > $max) {
            throw ValidationException::withMessages([
                "lines.{$index}.modifiers" => $max === 1
                    ? "Only one {$group->name} can be chosen."
                    : "Choose at most {$max} from {$group->name}.",
            ]);
        }
    }

    /**
     * Resolve a combo's slots to the real products going out of the door.
     *
     * Every slot is filled, whether or not the cashier chose: an unanswered slot
     * falls back to its default rather than silently shipping nothing.
     *
     * @param  array<string, mixed>  $line
     * @return list<array<string, mixed>>
     *
     * @throws ValidationException
     */
    private function resolveComponents(Product $product, array $line, int $index, bool $enabled): array
    {
        /** @var list<array<string, mixed>> $chosen */
        $chosen = $line['components'] ?? [];

        if (! $product->is_combo) {
            if ($chosen !== []) {
                throw ValidationException::withMessages([
                    "lines.{$index}.components" => 'This product is not a combo, so it has no components to choose.',
                ]);
            }

            return [];
        }

        if (! $enabled) {
            throw ValidationException::withMessages([
                "lines.{$index}.product_id" => 'Combo meals are switched off for this company.',
            ]);
        }

        $slots = $product->relationLoaded('comboSlots') ? $product->comboSlots : collect();

        if ($slots->isEmpty()) {
            throw ValidationException::withMessages([
                "lines.{$index}.product_id" => 'This combo has no components set up yet, so it cannot be sold.',
            ]);
        }

        // One choice per slot at most; the last one wins would hide a client bug.
        $choiceBySlot = [];
        foreach ($chosen as $choice) {
            $optionId = $choice['combo_slot_option_id'] ?? null;
            $slot = $slots->first(fn (ComboSlot $s) => $s->options->contains('id', $optionId));

            if (! $slot) {
                throw ValidationException::withMessages([
                    "lines.{$index}.components" => 'That component is not part of this combo.',
                ]);
            }

            if (isset($choiceBySlot[$slot->id])) {
                throw ValidationException::withMessages([
                    "lines.{$index}.components" => "The {$slot->name} was chosen more than once.",
                ]);
            }

            $choiceBySlot[$slot->id] = $slot->options->firstWhere('id', $optionId);
        }

        $components = [];

        foreach ($slots as $slot) {
            $option = $choiceBySlot[$slot->id] ?? $slot->defaultOption();

            if (! $option) {
                throw ValidationException::withMessages([
                    "lines.{$index}.components" => "The {$slot->name} has no options set up, so this combo cannot be sold.",
                ]);
            }

            // A fixed slot is not the cashier's to change.
            if (! $slot->is_swappable && isset($choiceBySlot[$slot->id]) && ! $option->is_default) {
                throw ValidationException::withMessages([
                    "lines.{$index}.components" => "The {$slot->name} on this combo cannot be swapped.",
                ]);
            }

            $components[] = [
                'combo_slot_id' => $slot->id,
                'combo_slot_option_id' => $option->id,
                'product_id' => $option->product_id,
                'slot_name' => $slot->name,
                'name' => $option->product?->name ?? $slot->name,
                'quantity' => (float) $slot->quantity,
                'price_delta' => round((float) $option->price_delta, 2),
            ];
        }

        return $components;
    }

    /**
     * Work out a line's tax from the product's configured tax.
     *
     * Whether tax is inclusive is read from the tax itself (`taxes.is_inclusive`),
     * not from the terminal, so a VAT-inclusive shelf price and a tax-on-top price
     * can coexist in one basket.
     *
     * @return array{0: float, 1: float, 2: float} tax amount, taxable amount, line total
     */
    private function applyTax(Product $product, float $net): array
    {
        $tax = $product->tax;
        $sellable = $tax && $tax->status === 'active' && in_array($tax->type, ['sales', 'both'], true);
        $rate = $sellable ? (float) $tax->rate : 0.0;

        if ($rate <= 0) {
            return [0.0, $net, $net];
        }

        if ($tax->is_inclusive) {
            // The shelf price already contains the tax, so carve it back out rather
            // than adding to what the customer was quoted.
            $taxAmount = round($net - ($net / (1 + ($rate / 100))), 2);

            return [$taxAmount, round($net - $taxAmount, 2), $net];
        }

        $taxAmount = round($net * ($rate / 100), 2);

        return [$taxAmount, $net, round($net + $taxAmount, 2)];
    }
}
