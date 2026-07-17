<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A modifier as it was actually sold.
 *
 * `name` and `price_delta` are copies, not lookups: repricing "Extra cheese"
 * tomorrow must not rewrite what a receipt from today says it charged.
 */
class SalesDetailModifier extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'sales_detail_id',
        'modifier_option_id',
        'modifier_group_id',
        'group_name',
        'name',
        'price_delta',
        'product_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
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
     * @return BelongsTo<ModifierOption, $this>
     */
    public function option(): BelongsTo
    {
        return $this->belongsTo(ModifierOption::class, 'modifier_option_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
