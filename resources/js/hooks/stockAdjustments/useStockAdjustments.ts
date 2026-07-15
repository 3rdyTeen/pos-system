import { api } from '@/lib/api';
import { Paginated, StockAdjustment, StockAdjustmentFilters, StockAdjustmentStatus } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const stockAdjustmentKeys = {
    all: ['stock-adjustments'] as const,
    lists: () => [...stockAdjustmentKeys.all, 'list'] as const,
    list: (filters: StockAdjustmentFilters) => [...stockAdjustmentKeys.lists(), filters] as const,
    detail: (id: string) => [...stockAdjustmentKeys.all, 'detail', id] as const,
};

export interface StockAdjustmentLinePayload {
    product_id: string;
    product_variant_id: string | null;
    system_qty: string;
    counted_qty: string;
    unit_cost: string;
}

export interface StockAdjustmentPayload {
    warehouse_id: string;
    reason: string;
    status: StockAdjustmentStatus;
    adjustment_date: string | null;
    notes: string;
    details: StockAdjustmentLinePayload[];
}

export function useStockAdjustments(filters: StockAdjustmentFilters) {
    return useQuery({
        queryKey: stockAdjustmentKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<StockAdjustment>>('/api/stock-adjustments', {
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

/** A single adjustment with its lines, used to hydrate the edit sheet. */
export function useStockAdjustment(id: string) {
    return useQuery({
        queryKey: stockAdjustmentKeys.detail(id),
        queryFn: () => api.get<{ data: StockAdjustment }>(`/api/stock-adjustments/${id}`),
        select: (response) => response.data,
        enabled: id !== '',
    });
}

export function useCreateStockAdjustment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: StockAdjustmentPayload) => api.post<{ data: StockAdjustment }>('/api/stock-adjustments', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.all }),
    });
}

export function useUpdateStockAdjustment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: StockAdjustmentPayload & { id: string }) =>
            api.put<{ data: StockAdjustment }>(`/api/stock-adjustments/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.all }),
    });
}

export function useDeleteStockAdjustment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/stock-adjustments/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.all }),
    });
}
