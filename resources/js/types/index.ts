import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    /** Flat list of granted permission codes, e.g. "inventory.view". */
    permissions: string[];
}

/** A node in the dynamic, DB-driven navigation tree (shared via Inertia). */
export interface NavNode {
    id: string;
    name: string;
    url: string;
    icon: string | null;
    children: NavNode[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    navigation: NavNode[];
    [key: string]: unknown;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

/** Laravel API resource collection (paginated) response shape. */
export interface Paginated<T> {
    data: T[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number | null;
        to: number | null;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    is_enabled: boolean;
    users_count?: number;
    created_at: string;
    updated_at: string;
}

/** Minimal role reference used by selection inputs. */
export interface RoleOption {
    id: string;
    name: string;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    profile_image_url: string | null;
    is_enabled: boolean;
    role_id: string | null;
    role: {
        id: string;
        name: string;
        is_enabled: boolean;
    } | null;
    created_at: string;
    updated_at: string;
}

export type StatusFilter = 'all' | 'enabled' | 'disabled';
export type SortDirection = 'asc' | 'desc';

export interface RoleFilters {
    search: string;
    status: StatusFilter;
    sort: string;
    direction: SortDirection;
    page: number;
}

export interface UserFilters {
    search: string;
    status: StatusFilter;
    role_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export interface Module {
    id: string;
    name: string;
    code: string;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: string;
    name: string;
    code: string;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

/** Minimal reference used by selection inputs. */
export interface ModuleOption {
    id: string;
    name: string;
    code: string;
}

export interface Navigation {
    id: string;
    module_id: string;
    parent_id: string | null;
    name: string;
    code: string;
    icon: string | null;
    url: string;
    order: number;
    module?: { id: string; name: string; code: string };
    parent?: { id: string; name: string } | null;
    created_at: string;
    updated_at: string;
}

export interface ModuleFilters {
    search: string;
    status: StatusFilter;
    sort: string;
    direction: SortDirection;
    page: number;
}

export type PermissionFilters = ModuleFilters;

export interface NavigationFilters {
    search: string;
    module_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/** Role "Manage Permissions" matrix (per enabled module + its enabled permissions). */
export interface RolePermissionMatrixPermission {
    permission_id: string;
    name: string;
    code: string;
    generated_code: string;
    granted: boolean;
}

export interface RolePermissionMatrixModule {
    module_id: string;
    name: string;
    code: string;
    granted: boolean;
    permissions: RolePermissionMatrixPermission[];
}
