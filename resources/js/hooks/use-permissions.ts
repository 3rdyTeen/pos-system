import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * Access the authenticated user's granted permission codes and a `can()` helper.
 * Permission codes are DB-driven ("{module.code}.{permission.code}") — never
 * hardcoded on the client.
 */
export function usePermissions() {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth?.permissions ?? [];

    return {
        permissions,
        can: (code: string) => permissions.includes(code),
    };
}
