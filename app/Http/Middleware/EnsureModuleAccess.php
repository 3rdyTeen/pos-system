<?php

namespace App\Http\Middleware;

use App\Services\AuthorizationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforces database-driven authorization for page routes: resolves the current
 * path to a module via the navigations table and requires the user's role to
 * hold "{module.code}.view". Paths not tied to any navigation are left open.
 */
class EnsureModuleAccess
{
    public function __construct(private readonly AuthorizationService $authorization) {}

    public function handle(Request $request, Closure $next): Response
    {
        $moduleCode = $this->authorization->moduleCodeForUrl($request->path());

        // Ungated route (no navigation record points at it).
        if ($moduleCode === null) {
            return $next($request);
        }

        $role = $request->user()?->role;

        abort_unless($this->authorization->canAccessModule($role, $moduleCode), 403);

        return $next($request);
    }
}
