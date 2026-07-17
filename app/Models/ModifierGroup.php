<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A reusable set of choices offered against a product: "Size", "Add-ons".
 *
 * Not a ProductVariant: a variant is its own sellable SKU with its own stock, a
 * modifier is a per-line choice that nudges the price of what is being sold.
 */
class ModifierGroup extends Model
{
    use HasFactory, HasUuids;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'name',
        'selection_type',
        'is_required',
        'min_select',
        'max_select',
        'sort_order',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'min_select' => 'integer',
            'max_select' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Company, $this>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * @return HasMany<ModifierOption, $this>
     */
    public function options(): HasMany
    {
        return $this->hasMany(ModifierOption::class)->orderBy('sort_order');
    }

    /**
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_modifier_groups')
            ->withPivot('sort_order');
    }

    /**
     * The effective number of choices this group demands.
     *
     * A required `single` group means exactly one, whatever min/max say — that is
     * what "pick a size" means — so the rule lives here rather than being restated
     * by every caller.
     *
     * @return array{0: int, 1: int|null} min, max (null = unlimited)
     */
    public function selectionBounds(): array
    {
        if ($this->selection_type === 'single') {
            return [$this->is_required ? 1 : 0, 1];
        }

        return [
            $this->is_required ? max(1, $this->min_select) : $this->min_select,
            $this->max_select,
        ];
    }
}
