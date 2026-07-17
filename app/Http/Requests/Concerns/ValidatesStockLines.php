<?php

namespace App\Http\Requests\Concerns;

use App\Models\ProductVariant;
use Closure;

/**
 * Shared line-item rules for documents that carry an array of stock lines,
 * whatever that array is called (`details` on a purchase, `lines` on a sale).
 */
trait ValidatesStockLines
{
    /**
     * Ensures a line's variant actually belongs to that line's product.
     *
     * A bare `exists` check only proves the variant exists somewhere, which would
     * happily accept a variant of a completely different product.
     */
    protected function variantMatchesLineProduct(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (! $value) {
                return;
            }

            // $attribute looks like "details.0.product_variant_id" or
            // "lines.0.product_variant_id" — take the sibling product_id either way.
            [$prefix, $index] = array_pad(explode('.', $attribute), 2, null);
            $productId = $index === null ? null : $this->input("{$prefix}.{$index}.product_id");

            if (! $productId) {
                return;
            }

            $belongs = ProductVariant::query()
                ->where('id', $value)
                ->where('product_id', $productId)
                ->exists();

            if (! $belongs) {
                $fail('The selected variant does not belong to this line\'s product.');
            }
        };
    }
}
