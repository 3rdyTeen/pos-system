import { api } from '@/lib/api';
import { Paginated, Tax, TaxFilters, TaxOption } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const taxKeys = {
    all: ['taxes'] as const,
    lists: () => [...taxKeys.all, 'list'] as const,
    list: (filters: TaxFilters) => [...taxKeys.lists(), filters] as const,
    options: (companyId?: string) => [...taxKeys.all, 'options', companyId ?? null] as const,
};

export function useTaxes(filters: TaxFilters) {
    return useQuery({
        queryKey: taxKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Tax>>('/api/taxes', {
                search: filters.search,
                status: filters.status,
                company_id: filters.company_id === 'all' ? undefined : filters.company_id,
                type: filters.type === 'all' ? undefined : filters.type,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** Taxes for selection inputs (e.g. the product tax dropdown), optionally scoped to a company. */
export function useTaxOptions(companyId?: string) {
    return useQuery({
        queryKey: taxKeys.options(companyId),
        queryFn: () => api.get<{ data: TaxOption[] }>('/api/taxes/options', { company_id: companyId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
