import { api } from '@/lib/api';
import { AdminUser, Paginated, UserFilters } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
};

export function useUsers(filters: UserFilters) {
    return useQuery({
        queryKey: userKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<AdminUser>>('/api/users', {
                search: filters.search,
                status: filters.status,
                role_id: filters.role_id === 'all' ? undefined : filters.role_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}
