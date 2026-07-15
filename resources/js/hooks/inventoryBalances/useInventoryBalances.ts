import { api } from '@/lib/api';
import { InventoryBalance, InventoryBalanceFilters, Paginated } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const inventoryBalanceKeys = {
    all: ['inventory-balances'] as const,
    lists: () => [...inventoryBalanceKeys.all, 'list'] as const,
    list: (filters: InventoryBalanceFilters) => [...inventoryBalanceKeys.lists(), filters] as const,
};

/** Balances are derived from stock postings, so this is the only hook — read-only. */
export function useInventoryBalances(filters: InventoryBalanceFilters) {
    return useQuery({
        queryKey: inventoryBalanceKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<InventoryBalance>>('/api/inventory-balances', {
                search: filters.search,
                warehouse_id: filters.warehouse_id === 'all' ? undefined : filters.warehouse_id,
                stock: filters.stock,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}
