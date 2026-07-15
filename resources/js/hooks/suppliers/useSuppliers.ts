import { api } from '@/lib/api';
import { Paginated, Supplier, SupplierFilters, SupplierOption } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const supplierKeys = {
    all: ['suppliers'] as const,
    lists: () => [...supplierKeys.all, 'list'] as const,
    list: (filters: SupplierFilters) => [...supplierKeys.lists(), filters] as const,
    options: (companyId?: string) => [...supplierKeys.all, 'options', companyId ?? null] as const,
};

export function useSuppliers(filters: SupplierFilters) {
    return useQuery({
        queryKey: supplierKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Supplier>>('/api/suppliers', {
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

/** Suppliers for selection inputs, optionally scoped to a company. */
export function useSupplierOptions(companyId?: string) {
    return useQuery({
        queryKey: supplierKeys.options(companyId),
        queryFn: () => api.get<{ data: SupplierOption[] }>('/api/suppliers/options', { company_id: companyId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
