import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Generates a client-side id, used to key rows that do not exist on the server yet.
 *
 * `crypto.randomUUID` is only defined in a secure context, which rules out plain-http
 * origins such as the `.test` domains Herd serves locally. The fallback keeps these
 * ids working there; they never leave the browser, so they only need to be unique
 * within the page.
 */
export function uid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
