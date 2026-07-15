<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustmentDetail extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * `difference` is a stored generated column (counted_qty - system_qty) and must
     * never be written.
     *
     * @var list<string>
     */
    protected $fillable = [
        'stock_adjustment_id',
        'product_id',
        'product_variant_id',
        'system_qty',
        'counted_qty',
        'unit_cost',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'system_qty' => 'decimal:4',
            'counted_qty' => 'decimal:4',
            'difference' => 'decimal:4',
            'unit_cost' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<StockAdjustment, $this>
     */
    public function adjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class, 'stock_adjustment_id');
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
