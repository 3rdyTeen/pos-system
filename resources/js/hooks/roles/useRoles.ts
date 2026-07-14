import { api } from '@/lib/api';
import { Paginated, Role, RoleFilters, RoleOption } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const roleKeys = {
    all: ['roles'] as const,
    lists: () => [...roleKeys.all, 'list'] as const,
    list: (filters: RoleFilters) => [...roleKeys.lists(), filters] as const,
    enabled: () => [...roleKeys.all, 'enabled'] as const,
};

export function useRoles(filters: RoleFilters) {
    return useQuery({
        queryKey: roleKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Role>>('/api/roles', {
                search: filters.search,
                status: filters.status,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** Enabled, non-deleted roles for selection inputs (e.g. the user role dropdown). */
export function useEnabledRoles() {
    return useQuery({
        queryKey: roleKeys.enabled(),
        queryFn: () => api.get<{ data: RoleOption[] }>('/api/roles/enabled'),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
