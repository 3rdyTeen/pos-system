<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The terminal's configuration. This is what makes one POS screen serve a grocery
 * lane, a fast-food counter and a retail desk without forking the code: the
 * terminal reads a profile and adapts, so a new vertical is a row rather than a
 * new page.
 *
 * PosProfileService::resolveFor() supplies a fallback when a register has no
 * profile, so every field here has a workable default.
 */
class PosProfile extends Model
{
    use HasFactory, HasUuids;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'name',
        'code',
        'picking_mode',
        'order_types',
        'default_order_type',
        'quick_tender',
        'require_customer',
        'allow_held_orders',
        'allow_negative_stock',
        'is_default',
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
            'order_types' => 'array',
            'quick_tender' => 'array',
            'require_customer' => 'boolean',
            'allow_held_orders' => 'boolean',
            'allow_negative_stock' => 'boolean',
            'is_default' => 'boolean',
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
     * @return HasMany<Register, $this>
     */
    public function registers(): HasMany
    {
        return $this->hasMany(Register::class);
    }
}
