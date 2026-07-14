import { api } from '@/lib/api';
import { Navigation, NavigationFilters, Paginated } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const navigationKeys = {
    all: ['navigations'] as const,
    lists: () => [...navigationKeys.all, 'list'] as const,
    list: (filters: NavigationFilters) => [...navigationKeys.lists(), filters] as const,
};

export function useNavigations(filters: NavigationFilters) {
    return useQuery({
        queryKey: navigationKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Navigation>>('/api/navigations', {
                search: filters.search,
                module_id: filters.module_id === 'all' ? undefined : filters.module_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}
