<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * What a combo line actually resolved to.
 *
 * A combo product carries no stock, so these rows are the record of which real
 * products left the shop — what stock is deducted against, and the only way to know
 * later that the meal went out with an iced tea rather than a cola.
 */
class SalesDetailComponent extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'sales_detail_id',
        'combo_slot_id',
        'combo_slot_option_id',
        'product_id',
        'slot_name',
        'name',
        'quantity',
        'price_delta',
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
            'price_delta' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<SalesDetail, $this>
     */
    public function detail(): BelongsTo
    {
        return $this->belongsTo(SalesDetail::class, 'sales_detail_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
