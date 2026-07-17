<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A tax breakdown row against a sale.
 *
 * The rate and name are copied in rather than read through the tax relation so a
 * historical receipt still reports what was actually charged after the tax rate
 * is later changed.
 */
class SalesTax extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'sale_id',
        'sales_detail_id',
        'tax_id',
        'tax_name',
        'rate',
        'taxable_amount',
        'tax_amount',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rate' => 'decimal:3',
            'taxable_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
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
     * @return BelongsTo<SalesDetail, $this>
     */
    public function detail(): BelongsTo
    {
        return $this->belongsTo(SalesDetail::class, 'sales_detail_id');
    }

    /**
     * @return BelongsTo<Tax, $this>
     */
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }
}
