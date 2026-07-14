/**
 * Small fetch wrapper for the JSON API.
 *
 * - Shares the Inertia session (same-origin credentials).
 * - Sends the `X-XSRF-TOKEN` header on writes so Laravel's CSRF check passes.
 * - Spoofs the HTTP method for FormData writes (PHP cannot parse multipart PUT/PATCH bodies).
 * - Throws {@link ApiError} on any non-2xx response, exposing Laravel validation errors.
 */

export type ValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
    public readonly status: number;
    public readonly errors: ValidationErrors;

    constructor(status: number, message: string, errors: ValidationErrors = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function readXsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : null;
}

function buildUrl(url: string, query?: Query): string {
    if (!query) {
        return url;
    }

    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, String(value));
        }
    }

    const qs = params.toString();

    return qs ? `${url}?${qs}` : url;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    const isWrite = method !== 'GET' && method !== 'HEAD';

    if (isWrite) {
        const token = readXsrfToken();
        if (token) {
            headers['X-XSRF-TOKEN'] = token;
        }
    }

    let httpMethod = method;
    let payload: BodyInit | undefined;

    if (body instanceof FormData) {
        // Multipart writes must go out as POST with a spoofed method.
        if (isWrite && method !== 'POST') {
            body.append('_method', method);
            httpMethod = 'POST';
        }
        payload = body;
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    const response = await fetch(url, {
        method: httpMethod,
        headers,
        body: payload,
        credentials: 'same-origin',
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
        throw new ApiError(
            response.status,
            (data && (data.message as string)) || response.statusText || 'Request failed',
            (data && (data.errors as ValidationErrors)) || {},
        );
    }

    return data as T;
}

export const api = {
    get: <T>(url: string, query?: Query) => request<T>('GET', buildUrl(url, query)),
    post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
    put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
    patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
    delete: <T>(url: string, body?: unknown) => request<T>('DELETE', url, body),
};
