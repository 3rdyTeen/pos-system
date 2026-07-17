<?php

namespace App\Services;

use App\Models\PosProfile;
use App\Models\Register;

/**
 * Resolves the configuration a terminal runs under.
 *
 * The terminal never reads pos_profiles directly. It asks for the effective
 * config for a register and gets a fully populated array, so an unconfigured
 * register still opens a working till instead of erroring — which matters because
 * the very first thing a new install does is sell something.
 */
class PosProfileService
{
    /**
     * The config a terminal falls back to when nothing is set up.
     *
     * Deliberately permissive: hybrid picking works for a scanner and a touchscreen
     * alike, and negative stock is allowed so an install with no stock counted yet
     * can still trade.
     *
     * @var array<string, mixed>
     */
    private const DEFAULTS = [
        'id' => null,
        'name' => 'Default',
        'picking_mode' => 'hybrid',
        'order_types' => ['retail'],
        'default_order_type' => 'retail',
        'quick_tender' => [20, 50, 100, 200, 500, 1000],
        'require_customer' => false,
        'allow_held_orders' => true,
        'allow_negative_stock' => true,
    ];

    /**
     * The effective config for a register, resolved in order of specificity:
     * the register's own profile, then its company's default profile, then the
     * built-in defaults.
     *
     * @return array<string, mixed>
     */
    public function resolveFor(?Register $register): array
    {
        $profile = $register?->posProfile;

        if ($profile === null || $profile->status !== 'active') {
            $profile = $this->companyDefault($register);
        }

        if ($profile === null) {
            return self::DEFAULTS;
        }

        return [
            'id' => $profile->id,
            'name' => $profile->name,
            'picking_mode' => $profile->picking_mode,
            'order_types' => $profile->order_types ?: self::DEFAULTS['order_types'],
            'default_order_type' => $profile->default_order_type
                ?? ($profile->order_types[0] ?? self::DEFAULTS['default_order_type']),
            'quick_tender' => $profile->quick_tender ?: self::DEFAULTS['quick_tender'],
            'require_customer' => $profile->require_customer,
            'allow_held_orders' => $profile->allow_held_orders,
            'allow_negative_stock' => $profile->allow_negative_stock,
        ];
    }

    /**
     * The company-wide default profile for the register's branch, if there is one.
     */
    private function companyDefault(?Register $register): ?PosProfile
    {
        $companyId = $register?->branch?->company_id;

        if ($companyId === null) {
            return null;
        }

        return PosProfile::query()
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->where('is_default', true)
            ->first();
    }
}
