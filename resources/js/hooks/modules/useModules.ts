import { api } from '@/lib/api';
import { Module, ModuleFilters, ModuleOption, Paginated } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const moduleKeys = {
    all: ['modules'] as const,
    lists: () => [...moduleKeys.all, 'list'] as const,
    list: (filters: ModuleFilters) => [...moduleKeys.lists(), filters] as const,
    enabled: () => [...moduleKeys.all, 'enabled'] as const,
};

export function useModules(filters: ModuleFilters) {
    return useQuery({
        queryKey: moduleKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Module>>('/api/modules', {
                search: filters.search,
                status: filters.status,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** Enabled, non-deleted modules for selection inputs (e.g. the navigation form). */
export function useEnabledModules() {
    return useQuery({
        queryKey: moduleKeys.enabled(),
        queryFn: () => api.get<{ data: ModuleOption[] }>('/api/modules/enabled'),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
