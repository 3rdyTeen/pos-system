import { api } from '@/lib/api';
import { Paginated, StockTransfer, StockTransferFilters, StockTransferStatus } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const stockTransferKeys = {
    all: ['stock-transfers'] as const,
    lists: () => [...stockTransferKeys.all, 'list'] as const,
    list: (filters: StockTransferFilters) => [...stockTransferKeys.lists(), filters] as const,
    detail: (id: string) => [...stockTransferKeys.all, 'detail', id] as const,
};

export interface StockTransferLinePayload {
    product_id: string;
    product_variant_id: string | null;
    quantity: string;
    unit_cost: string;
}

export interface StockTransferPayload {
    from_warehouse_id: string;
    to_warehouse_id: string;
    status: StockTransferStatus;
    transfer_date: string | null;
    notes: string;
    details: StockTransferLinePayload[];
}

export function useStockTransfers(filters: StockTransferFilters) {
    return useQuery({
        queryKey: stockTransferKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<StockTransfer>>('/api/stock-transfers', {
                search: filters.search,
                status: filters.status,
                warehouse_id: filters.warehouse_id === 'all' ? undefined : filters.warehouse_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** A single transfer with its lines, used to hydrate the edit sheet. */
export function useStockTransfer(id: string) {
    return useQuery({
        queryKey: stockTransferKeys.detail(id),
        queryFn: () => api.get<{ data: StockTransfer }>(`/api/stock-transfers/${id}`),
        select: (response) => response.data,
        enabled: id !== '',
    });
}

export function useCreateStockTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: StockTransferPayload) => api.post<{ data: StockTransfer }>('/api/stock-transfers', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: stockTransferKeys.all }),
    });
}

export function useUpdateStockTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: StockTransferPayload & { id: string }) =>
            api.put<{ data: StockTransfer }>(`/api/stock-transfers/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: stockTransferKeys.all }),
    });
}

export function useDeleteStockTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/stock-transfers/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: stockTransferKeys.all }),
    });
}
