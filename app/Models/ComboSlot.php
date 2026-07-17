<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A component position within a combo meal: its "Drink" or its "Side".
 */
class ComboSlot extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'name',
        'quantity',
        'is_swappable',
        'sort_order',
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
            'is_swappable' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * The combo product this slot belongs to.
     *
     * @return BelongsTo<Product, $this>
     */
    public function combo(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * @return HasMany<ComboSlotOption, $this>
     */
    public function options(): HasMany
    {
        return $this->hasMany(ComboSlotOption::class)->orderBy('sort_order');
    }

    /**
     * What this slot resolves to when the cashier does not choose: the option
     * flagged default, else the first one.
     */
    public function defaultOption(): ?ComboSlotOption
    {
        $options = $this->relationLoaded('options') ? $this->options : $this->options()->get();

        return $options->firstWhere('is_default', true) ?? $options->first();
    }
}
