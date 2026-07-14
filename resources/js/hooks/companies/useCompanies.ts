import { api } from '@/lib/api';
import { Company, CompanyFilters, CompanyOption, Paginated } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const companyKeys = {
    all: ['companies'] as const,
    lists: () => [...companyKeys.all, 'list'] as const,
    list: (filters: CompanyFilters) => [...companyKeys.lists(), filters] as const,
    options: () => [...companyKeys.all, 'options'] as const,
};

export function useCompanies(filters: CompanyFilters) {
    return useQuery({
        queryKey: companyKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Company>>('/api/companies', {
                search: filters.search,
                status: filters.status,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** Companies for selection inputs (e.g. the branch company dropdown). */
export function useCompanyOptions() {
    return useQuery({
        queryKey: companyKeys.options(),
        queryFn: () => api.get<{ data: CompanyOption[] }>('/api/companies/options'),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
