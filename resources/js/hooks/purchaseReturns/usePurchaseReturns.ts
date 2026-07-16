import { api } from '@/lib/api';
import { Paginated, PurchaseReturn, PurchaseReturnFilters, PurchaseReturnStatus } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const purchaseReturnKeys = {
    all: ['purchase-returns'] as const,
    lists: () => [...purchaseReturnKeys.all, 'list'] as const,
    list: (filters: PurchaseReturnFilters) => [...purchaseReturnKeys.lists(), filters] as const,
    detail: (id: string) => [...purchaseReturnKeys.all, 'detail', id] as const,
};

export interface PurchaseReturnLinePayload {
    purchase_detail_id: string | null;
    product_id: string;
    product_variant_id: string | null;
    quantity: string;
    unit_cost: string;
}

/** Money is absent by design: total_amount is computed server-side from the lines. */
export interface PurchaseReturnPayload {
    purchase_order_id: string;
    branch_id: string;
    return_date: string | null;
    reason: string;
    status: PurchaseReturnStatus;
    details: PurchaseReturnLinePayload[];
}

export function usePurchaseReturns(filters: PurchaseReturnFilters) {
    return useQuery({
        queryKey: purchaseReturnKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<PurchaseReturn>>('/api/purchase-returns', {
                search: filters.search,
                status: filters.status,
                purchase_order_id: filters.purchase_order_id === 'all' ? undefined : filters.purchase_order_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** A single return with its lines, used to hydrate the edit sheet. */
export function usePurchaseReturn(id: string) {
    return useQuery({
        queryKey: purchaseReturnKeys.detail(id),
        queryFn: () => api.get<{ data: PurchaseReturn }>(`/api/purchase-returns/${id}`),
        select: (response) => response.data,
        enabled: id !== '',
    });
}

export function useCreatePurchaseReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PurchaseReturnPayload) => api.post<{ data: PurchaseReturn }>('/api/purchase-returns', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.all }),
    });
}

export function useUpdatePurchaseReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: PurchaseReturnPayload & { id: string }) =>
            api.put<{ data: PurchaseReturn }>(`/api/purchase-returns/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.all }),
    });
}

export function useDeletePurchaseReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/purchase-returns/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.all }),
    });
}
