<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Register extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'pos_profile_id',
        'name',
        'code',
        'ip_address',
        'status',
    ];

    /**
     * The branch this register belongs to.
     *
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * The terminal configuration this register runs under. Nullable — an
     * unconfigured register falls back to its company default, then to the
     * built-in defaults in PosProfileService.
     *
     * @return BelongsTo<PosProfile, $this>
     */
    public function posProfile(): BelongsTo
    {
        return $this->belongsTo(PosProfile::class);
    }

    /**
     * @return HasMany<Shift, $this>
     */
    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }
}
