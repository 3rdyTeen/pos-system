<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'variant_name',
        'sku',
        'attributes',
        'cost_price',
        'selling_price',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attributes' => 'array',
            'cost_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
        ];
    }

    /**
     * The product this variant belongs to.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Barcodes assigned to this variant.
     *
     * @return HasMany<ProductBarcode, $this>
     */
    public function barcodes(): HasMany
    {
        return $this->hasMany(ProductBarcode::class);
    }
}
