import { api } from '@/lib/api';
import { Branch, BranchFilters, BranchOption, Paginated } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const branchKeys = {
    all: ['branches'] as const,
    lists: () => [...branchKeys.all, 'list'] as const,
    list: (filters: BranchFilters) => [...branchKeys.lists(), filters] as const,
    options: () => [...branchKeys.all, 'options'] as const,
};

export function useBranches(filters: BranchFilters) {
    return useQuery({
        queryKey: branchKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Branch>>('/api/branches', {
                search: filters.search,
                status: filters.status,
                company_id: filters.company_id === 'all' ? undefined : filters.company_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** Branches for selection inputs (e.g. the register branch dropdown). */
export function useBranchOptions() {
    return useQuery({
        queryKey: branchKeys.options(),
        queryFn: () => api.get<{ data: BranchOption[] }>('/api/branches/options'),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
