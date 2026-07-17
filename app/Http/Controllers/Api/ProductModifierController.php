<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ModifierGroupResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Which modifier groups a product offers, managed from the product page.
 *
 * The mirror of ModifierGroupController's `product_ids`: that attaches one group to
 * many products, this attaches many groups to one product. Both write the same
 * pivot — they differ only in which side the user happens to be standing on.
 */
class ProductModifierController extends Controller
{
    public function index(Product $product): AnonymousResourceCollection
    {
        return ModifierGroupResource::collection(
            $product->modifierGroups()->with('options')->get(),
        );
    }

    /**
     * Replace the groups this product offers.
     */
    public function sync(Request $request, Product $product): AnonymousResourceCollection
    {
        $data = $request->validate([
            'group_ids' => ['present', 'array'],
            'group_ids.*' => [Rule::exists('modifier_groups', 'id')],
        ]);

        // Ordering follows the order they were sent, so the terminal asks for a size
        // before it asks about add-ons if that is how they were arranged here.
        $product->modifierGroups()->sync(
            collect($data['group_ids'])
                ->mapWithKeys(fn (string $id, int $index) => [$id => ['sort_order' => $index]])
                ->all(),
        );

        return ModifierGroupResource::collection(
            $product->modifierGroups()->with('options')->get(),
        );
    }
}
