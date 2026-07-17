<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'category_id',
        'name',
        'sku',
        'description',
        'brand',
        'base_unit_id',
        'tax_id',
        'cost_price',
        'selling_price',
        'reorder_level',
        'is_active',
        'is_combo',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'reorder_level' => 'decimal:2',
            'is_active' => 'boolean',
            'is_combo' => 'boolean',
        ];
    }

    /**
     * The company this product belongs to.
     *
     * @return BelongsTo<Company, $this>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * The category this product is filed under.
     *
     * @return BelongsTo<ProductCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    /**
     * The base unit of measure for this product.
     *
     * @return BelongsTo<Unit, $this>
     */
    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    /**
     * The default tax applied to this product.
     *
     * @return BelongsTo<Tax, $this>
     */
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }

    /**
     * Sellable variants of this product.
     *
     * @return HasMany<ProductVariant, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Units of measure configured for this product.
     *
     * @return HasMany<ProductUnit, $this>
     */
    public function productUnits(): HasMany
    {
        return $this->hasMany(ProductUnit::class);
    }

    /**
     * Barcodes assigned to this product.
     *
     * @return HasMany<ProductBarcode, $this>
     */
    public function barcodes(): HasMany
    {
        return $this->hasMany(ProductBarcode::class);
    }

    /**
     * Stock levels for this product across warehouses.
     *
     * Constrain by warehouse when eager loading — the POS grid does, so it can show
     * on-hand counts without a query per tile.
     *
     * @return HasMany<InventoryBalance, $this>
     */
    public function balances(): HasMany
    {
        return $this->hasMany(InventoryBalance::class);
    }

    /**
     * Choice groups offered against this product at the till.
     *
     * @return BelongsToMany<ModifierGroup, $this>
     */
    public function modifierGroups(): BelongsToMany
    {
        return $this->belongsToMany(ModifierGroup::class, 'product_modifier_groups')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }

    /**
     * The component positions of this product, when it is a combo. Empty otherwise.
     *
     * @return HasMany<ComboSlot, $this>
     */
    public function comboSlots(): HasMany
    {
        return $this->hasMany(ComboSlot::class)->orderBy('sort_order');
    }
}
