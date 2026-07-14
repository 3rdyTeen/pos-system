import { api } from '@/lib/api';
import { Paginated, Unit, UnitFilters, UnitOption } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const unitKeys = {
    all: ['units'] as const,
    lists: () => [...unitKeys.all, 'list'] as const,
    list: (filters: UnitFilters) => [...unitKeys.lists(), filters] as const,
    options: (companyId?: string) => [...unitKeys.all, 'options', companyId ?? null] as const,
};

export function useUnits(filters: UnitFilters) {
    return useQuery({
        queryKey: unitKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Unit>>('/api/units', {
                search: filters.search,
                company_id: filters.company_id === 'all' ? undefined : filters.company_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** Units for selection inputs (e.g. the base-unit dropdown), optionally scoped to a company. */
export function useUnitOptions(companyId?: string) {
    return useQuery({
        queryKey: unitKeys.options(companyId),
        queryFn: () => api.get<{ data: UnitOption[] }>('/api/units/options', { company_id: companyId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
