import { api } from '@/lib/api';
import { Paginated, Permission, PermissionFilters } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const permissionKeys = {
    all: ['permissions'] as const,
    lists: () => [...permissionKeys.all, 'list'] as const,
    list: (filters: PermissionFilters) => [...permissionKeys.lists(), filters] as const,
};

export function usePermissionList(filters: PermissionFilters) {
    return useQuery({
        queryKey: permissionKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Permission>>('/api/permissions', {
                search: filters.search,
                status: filters.status,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}
