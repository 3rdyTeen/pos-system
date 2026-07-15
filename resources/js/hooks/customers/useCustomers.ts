import { api } from '@/lib/api';
import { Customer, CustomerFilters, CustomerOption, Paginated } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const customerKeys = {
    all: ['customers'] as const,
    lists: () => [...customerKeys.all, 'list'] as const,
    list: (filters: CustomerFilters) => [...customerKeys.lists(), filters] as const,
    options: (companyId?: string) => [...customerKeys.all, 'options', companyId ?? null] as const,
};

export function useCustomers(filters: CustomerFilters) {
    return useQuery({
        queryKey: customerKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Customer>>('/api/customers', {
                search: filters.search,
                status: filters.status,
                company_id: filters.company_id === 'all' ? undefined : filters.company_id,
                customer_group_id: filters.customer_group_id === 'all' ? undefined : filters.customer_group_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** Customers for selection inputs, optionally scoped to a company. */
export function useCustomerOptions(companyId?: string) {
    return useQuery({
        queryKey: customerKeys.options(companyId),
        queryFn: () => api.get<{ data: CustomerOption[] }>('/api/customers/options', { company_id: companyId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
