import { api } from '@/lib/api';
import { Paginated, Warehouse, WarehouseFilters, WarehouseOption } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const warehouseKeys = {
    all: ['warehouses'] as const,
    lists: () => [...warehouseKeys.all, 'list'] as const,
    list: (filters: WarehouseFilters) => [...warehouseKeys.lists(), filters] as const,
    options: (branchId?: string) => [...warehouseKeys.all, 'options', branchId ?? null] as const,
};

export function useWarehouses(filters: WarehouseFilters) {
    return useQuery({
        queryKey: warehouseKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Warehouse>>('/api/warehouses', {
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

/** Warehouses for selection inputs, optionally scoped to a branch. */
export function useWarehouseOptions(branchId?: string) {
    return useQuery({
        queryKey: warehouseKeys.options(branchId),
        queryFn: () => api.get<{ data: WarehouseOption[] }>('/api/warehouses/options', { branch_id: branchId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
