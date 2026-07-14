<?php

namespace App\Services;

use App\Models\Navigation;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

/**
 * Computes the navigation tree and permission set for a role entirely from the
 * database. Nothing about navigation or authorization is hardcoded.
 *
 * Results are memoized per role for the lifetime of the request.
 */
class AuthorizationService
{
    /** @var array<string, list<string>> */
    private array $permissionCache = [];

    /** @var array<string, list<string>> */
    private array $visibleModuleCache = [];

    private function cacheKey(?Role $role): string
    {
        return $role?->getKey() ?? 'guest';
    }

    /**
     * Flat list of granted permission codes, e.g. ["inventory.view", "inventory.create"].
     * Only includes grants whose module and permission are both enabled and whose
     * module is currently granted to the role (role_modules). A module toggled off
     * for the role therefore contributes no effective permissions, even though its
     * permission selections remain stored.
     *
     * @return list<string>
     */
    public function permissionCodes(?Role $role): array
    {
        if (! $role) {
            return [];
        }

        $key = $this->cacheKey($role);

        if (isset($this->permissionCache[$key])) {
            return $this->permissionCache[$key];
        }

        $rows = DB::table('role_module_permissions as rmp')
            ->join('role_modules as rm', function ($join) {
                $join->on('rm.role_id', '=', 'rmp.role_id')
                    ->on('rm.module_id', '=', 'rmp.module_id');
            })
            ->join('modules as m', 'm.id', '=', 'rmp.module_id')
            ->join('permissions as p', 'p.id', '=', 'rmp.permission_id')
            ->where('rmp.role_id', $role->getKey())
            ->where('m.is_enabled', true)
            ->whereNull('m.deleted_at')
            ->where('p.is_enabled', true)
            ->whereNull('p.deleted_at')
            ->get(['m.code as module_code', 'p.code as permission_code']);

        return $this->permissionCache[$key] = $rows
            ->map(fn ($r) => $r->module_code.'.'.$r->permission_code)
            ->all();
    }

    /**
     * Module codes visible to the role: the module is enabled, granted to the role,
     * and the role holds the "{module.code}.view" permission.
     *
     * @return list<string>
     */
    public function visibleModuleCodes(?Role $role): array
    {
        if (! $role) {
            return [];
        }

        $key = $this->cacheKey($role);

        if (isset($this->visibleModuleCache[$key])) {
            return $this->visibleModuleCache[$key];
        }

        $grantedModuleCodes = DB::table('role_modules as rm')
            ->join('modules as m', 'm.id', '=', 'rm.module_id')
            ->where('rm.role_id', $role->getKey())
            ->where('m.is_enabled', true)
            ->whereNull('m.deleted_at')
            ->pluck('m.code')
            ->all();

        $permissionCodes = $this->permissionCodes($role);

        $visible = array_values(array_filter(
            $grantedModuleCodes,
            fn (string $code) => in_array("{$code}.view", $permissionCodes, true),
        ));

        return $this->visibleModuleCache[$key] = $visible;
    }

    /**
     * Whether the role may access (view) the given module code.
     */
    public function canAccessModule(?Role $role, string $moduleCode): bool
    {
        return in_array($moduleCode, $this->visibleModuleCodes($role), true);
    }

    /**
     * Resolve a request path (e.g. "modules") to its module code via the navigations
     * table, or null when the path is not associated with any navigation item.
     */
    public function moduleCodeForUrl(string $url): ?string
    {
        $url = '/'.ltrim($url, '/');

        $code = DB::table('navigations as n')
            ->join('modules as m', 'm.id', '=', 'n.module_id')
            ->whereNull('n.deleted_at')
            ->where('n.url', $url)
            ->value('m.code');

        return $code ?: null;
    }

    /**
     * Build the nested navigation tree the role is allowed to see, ordered by `order`.
     *
     * @return list<array{id:string,name:string,url:string,icon:?string,children:array}>
     */
    public function navigationTree(?Role $role): array
    {
        $visibleModuleCodes = $this->visibleModuleCodes($role);

        if (empty($visibleModuleCodes)) {
            return [];
        }

        $navigations = Navigation::query()
            ->with('module:id,code')
            ->whereHas('module', fn ($q) => $q->whereIn('code', $visibleModuleCodes))
            ->orderBy('order')
            ->get(['id', 'parent_id', 'name', 'url', 'icon', 'order', 'module_id']);

        $visibleIds = $navigations->pluck('id')->all();

        $childrenByParent = [];
        foreach ($navigations as $navigation) {
            // Promote to root when the parent is not itself visible.
            $parentKey = ($navigation->parent_id && in_array($navigation->parent_id, $visibleIds, true))
                ? $navigation->parent_id
                : null;

            $childrenByParent[$parentKey][] = $navigation;
        }

        return $this->buildBranch($childrenByParent, null);
    }

    /**
     * @param  array<string|null, list<Navigation>>  $childrenByParent
     * @return list<array{id:string,name:string,url:string,icon:?string,children:array}>
     */
    private function buildBranch(array $childrenByParent, ?string $parentId): array
    {
        $branch = [];

        foreach ($childrenByParent[$parentId] ?? [] as $navigation) {
            $branch[] = [
                'id' => $navigation->id,
                'name' => $navigation->name,
                'url' => $navigation->url,
                'icon' => $navigation->icon,
                'children' => $this->buildBranch($childrenByParent, $navigation->id),
            ];
        }

        return $branch;
    }
}
