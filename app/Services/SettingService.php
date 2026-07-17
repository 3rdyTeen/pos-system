<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

/**
 * Company-wide capability switches.
 *
 * This answers "can this company do X at all?", which is a different question from
 * the two nearby ones:
 *
 * - Modules/roles decide who may *open a page*.
 * - A POS profile decides how one *till behaves*.
 * - This decides which capabilities exist for the company in the first place.
 *
 * Every flag here gates real behaviour. A switch that toggles nothing is worse than
 * no switch, so this list stays honest: if it is here, something changes.
 */
class SettingService
{
    /**
     * The switches, their defaults, and what they actually do.
     *
     * Defaults are deliberately conservative: a plain retail shop that never opens
     * this page should not suddenly be asked which size of drink the customer wants.
     *
     * @var array<string, array{default: bool, label: string, description: string, group: string}>
     */
    public const FLAGS = [
        'modifiers.enabled' => [
            'default' => false,
            'label' => 'Product modifiers',
            'description' => 'Offer choices against a product at the till — Size, Add-ons, Sugar level. Turn this on for food service.',
            'group' => 'Catalogue',
        ],
        'combos.enabled' => [
            'default' => false,
            'label' => 'Combo meals',
            'description' => 'Sell bundles whose components can be swapped, like a meal whose drink the customer picks. Needs at least one combo product to be useful.',
            'group' => 'Catalogue',
        ],
        'sales.allow_price_override' => [
            'default' => true,
            'label' => 'Price override at the till',
            'description' => 'Let a cashier change a line\'s unit price during a sale. Turn this off to make the catalogue price final.',
            'group' => 'Terminal',
        ],
        'sales.allow_line_discount' => [
            'default' => true,
            'label' => 'Line discounts at the till',
            'description' => 'Let a cashier discount an individual line during a sale.',
            'group' => 'Terminal',
        ],
        'terminal.show_stock' => [
            'default' => true,
            'label' => 'Show stock on the terminal',
            'description' => 'Show remaining stock on product tiles and warn when a line goes past it.',
            'group' => 'Terminal',
        ],
    ];

    /**
     * Every flag for a company, defaults filled in for anything never saved.
     *
     * @return array<string, bool>
     */
    public function all(?string $companyId): array
    {
        $stored = $companyId
            ? Setting::query()
                ->where('company_id', $companyId)
                ->whereIn('setting_key', array_keys(self::FLAGS))
                ->pluck('setting_value', 'setting_key')
            : collect();

        $flags = [];

        foreach (self::FLAGS as $key => $meta) {
            $flags[$key] = $stored->has($key)
                ? filter_var($stored->get($key), FILTER_VALIDATE_BOOLEAN)
                : $meta['default'];
        }

        return $flags;
    }

    /**
     * Whether one capability is on. A company that does not exist yet gets defaults
     * rather than an error, so a half-configured install still runs.
     */
    public function enabled(?string $companyId, string $key): bool
    {
        return $this->all($companyId)[$key] ?? (self::FLAGS[$key]['default'] ?? false);
    }

    /**
     * Save a set of flags. Unknown keys are ignored rather than stored, so this
     * cannot be used to write arbitrary rows into the settings table.
     *
     * @param  array<string, bool>  $flags
     * @return array<string, bool>
     */
    public function save(string $companyId, array $flags): array
    {
        DB::transaction(function () use ($companyId, $flags) {
            foreach ($flags as $key => $value) {
                if (! array_key_exists($key, self::FLAGS)) {
                    continue;
                }

                Setting::query()->updateOrCreate(
                    ['company_id' => $companyId, 'setting_key' => $key],
                    ['setting_value' => $value ? '1' : '0'],
                );
            }
        });

        return $this->all($companyId);
    }

    /**
     * The company whose settings apply to the signed-in user.
     *
     * This app has no company scoping on the user, so a single-company install —
     * which is the common case — resolves to the only company there is.
     */
    public function resolveCompanyId(?string $branchCompanyId = null): ?string
    {
        return $branchCompanyId ?? Company::query()->orderBy('created_at')->value('id');
    }

    /**
     * The flags described for the control page: value plus what the switch means.
     *
     * @return list<array<string, mixed>>
     */
    public function describe(?string $companyId): array
    {
        $values = $this->all($companyId);

        return array_map(fn (string $key) => [
            'key' => $key,
            'value' => $values[$key],
            'label' => self::FLAGS[$key]['label'],
            'description' => self::FLAGS[$key]['description'],
            'group' => self::FLAGS[$key]['group'],
            'default' => self::FLAGS[$key]['default'],
        ], array_keys(self::FLAGS));
    }
}
