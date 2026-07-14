import { api } from '@/lib/api';
import { Paginated, Register, RegisterFilters } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const registerKeys = {
    all: ['registers'] as const,
    lists: () => [...registerKeys.all, 'list'] as const,
    list: (filters: RegisterFilters) => [...registerKeys.lists(), filters] as const,
};

export function useRegisters(filters: RegisterFilters) {
    return useQuery({
        queryKey: registerKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Register>>('/api/registers', {
                search: filters.search,
                status: filters.status,
                branch_id: filters.branch_id === 'all' ? undefined : filters.branch_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}
