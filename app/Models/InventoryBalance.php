<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Current stock level for a product (optionally a variant) in one warehouse.
 *
 * This is derived state: rows are maintained by stock postings, never edited
 * directly, which is why there is no create/update path for them.
 */
class InventoryBalance extends Model
{
    use HasFactory, HasUuids;

    /**
     * The table carries only an updated_at column.
     */
    const CREATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * `quantity_available` is a stored generated column (on_hand - reserved) and
     * must never be written.
     *
     * @var list<string>
     */
    protected $fillable = [
        'warehouse_id',
        'product_id',
        'product_variant_id',
        'quantity_on_hand',
        'quantity_reserved',
        'average_cost',
        'last_counted_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity_on_hand' => 'decimal:4',
            'quantity_reserved' => 'decimal:4',
            'quantity_available' => 'decimal:4',
            'average_cost' => 'decimal:4',
            'last_counted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
