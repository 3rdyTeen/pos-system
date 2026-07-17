<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesDetail extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * `line_total` is a plain column, not a generated one, so SaleService computes
     * and writes it rather than the database deriving it.
     *
     * @var list<string>
     */
    protected $fillable = [
        'sale_id',
        'product_id',
        'product_variant_id',
        'unit_id',
        'quantity',
        'unit_price',
        'discount_amount',
        'tax_amount',
        'line_total',
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
            'unit_price' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'line_total' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Sale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
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
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * The choices made against this line, as they were sold.
     *
     * @return HasMany<SalesDetailModifier, $this>
     */
    public function modifiers(): HasMany
    {
        return $this->hasMany(SalesDetailModifier::class, 'sales_detail_id');
    }

    /**
     * What this line resolved to, when it is a combo. Empty for a plain product.
     *
     * @return HasMany<SalesDetailComponent, $this>
     */
    public function components(): HasMany
    {
        return $this->hasMany(SalesDetailComponent::class, 'sales_detail_id');
    }
}
