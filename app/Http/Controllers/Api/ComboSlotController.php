<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ComboSlot;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The component positions of a combo product, managed from the product page.
 *
 * Slots are replaced wholesale rather than patched one at a time: a combo is
 * edited as a shape ("burger, fries, drink"), and treating it as a list keeps the
 * ordering and the defaults coherent.
 */
class ComboSlotController extends Controller
{
    /**
     * The slots of a combo, with what may fill each.
     */
    public function index(Product $product): JsonResponse
    {
        return response()->json([
            'data' => $this->payload($product),
        ]);
    }

    /**
     * Replace a combo's slots.
     */
    public function sync(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'slots' => ['present', 'array'],
            'slots.*.name' => ['required', 'string', 'max:100'],
            'slots.*.quantity' => ['required', 'numeric', 'gt:0'],
            'slots.*.is_swappable' => ['boolean'],
            'slots.*.options' => ['required', 'array', 'min:1'],
            'slots.*.options.*.product_id' => ['required', Rule::exists('products', 'id')],
            'slots.*.options.*.price_delta' => ['required', 'numeric'],
            'slots.*.options.*.is_default' => ['boolean'],
        ]);

        if (! $product->is_combo) {
            throw ValidationException::withMessages([
                'product' => 'This product is not a combo. Mark it as one before giving it components.',
            ]);
        }

        $this->assertNoSelfReference($product, $data['slots']);

        DB::transaction(function () use ($product, $data) {
            // Options cascade from the slot at the database level.
            $product->comboSlots()->delete();

            foreach ($data['slots'] as $index => $slot) {
                $row = $product->comboSlots()->create([
                    'name' => $slot['name'],
                    'quantity' => $slot['quantity'],
                    'is_swappable' => $slot['is_swappable'] ?? true,
                    'sort_order' => $index,
                ]);

                $this->createOptions($row, $slot['options']);
            }
        });

        return response()->json([
            'data' => $this->payload($product->fresh()),
            'message' => 'Combo components saved.',
        ]);
    }

    /**
     * Write a slot's options, guaranteeing exactly one default.
     *
     * Without a default an unanswered slot would resolve to nothing, so if the
     * client names none the first option takes the role.
     *
     * @param  list<array<string, mixed>>  $options
     */
    private function createOptions(ComboSlot $slot, array $options): void
    {
        $defaulted = false;

        foreach ($options as $index => $option) {
            $isDefault = ($option['is_default'] ?? false) && ! $defaulted;
            $defaulted = $defaulted || $isDefault;

            $slot->options()->create([
                'product_id' => $option['product_id'],
                'price_delta' => $option['price_delta'],
                'is_default' => $isDefault,
                'sort_order' => $index,
            ]);
        }

        if (! $defaulted) {
            $slot->options()->orderBy('sort_order')->first()?->update(['is_default' => true]);
        }
    }

    /**
     * A combo cannot contain itself, directly or as one of its own components —
     * that would recurse forever when the sale is priced and its stock posted.
     *
     * @param  list<array<string, mixed>>  $slots
     *
     * @throws ValidationException
     */
    private function assertNoSelfReference(Product $product, array $slots): void
    {
        foreach ($slots as $index => $slot) {
            foreach ($slot['options'] as $optionIndex => $option) {
                if ($option['product_id'] === $product->id) {
                    throw ValidationException::withMessages([
                        "slots.{$index}.options.{$optionIndex}.product_id" => 'A combo cannot contain itself.',
                    ]);
                }

                if (Product::query()->whereKey($option['product_id'])->value('is_combo')) {
                    throw ValidationException::withMessages([
                        "slots.{$index}.options.{$optionIndex}.product_id" => 'A combo cannot be a component of another combo.',
                    ]);
                }
            }
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function payload(Product $product): array
    {
        return $product->comboSlots()->with('options.product:id,name,sku')->get()
            ->map(fn (ComboSlot $slot) => [
                'id' => $slot->id,
                'name' => $slot->name,
                'quantity' => $slot->quantity,
                'is_swappable' => $slot->is_swappable,
                'sort_order' => $slot->sort_order,
                'options' => $slot->options->map(fn ($option) => [
                    'id' => $option->id,
                    'product_id' => $option->product_id,
                    'product_name' => $option->product?->name,
                    'price_delta' => $option->price_delta,
                    'is_default' => $option->is_default,
                ]),
            ])->all();
    }
}
