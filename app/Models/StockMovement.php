<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An append-only ledger line for stock. Rows are never edited or deleted: a
 * reversal is a new row with the opposite sign, which is what lets a void be
 * audited rather than hidden.
 *
 * `reference_type` / `reference_id` point loosely at whatever caused the movement
 * (a sale, a return) without a foreign key, so the referenced row can be of any
 * type. StockPostingService owns all writes here.
 */
class StockMovement extends Model
{
    use HasFactory, HasUuids;

    /**
     * The ledger records when a movement happened and never revises it.
     */
    const UPDATED_AT = null;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'warehouse_id',
        'product_id',
        'product_variant_id',
        'movement_type',
        'quantity',
        'reference_type',
        'reference_id',
        'before_qty',
        'after_qty',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'before_qty' => 'decimal:4',
            'after_qty' => 'decimal:4',
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

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
