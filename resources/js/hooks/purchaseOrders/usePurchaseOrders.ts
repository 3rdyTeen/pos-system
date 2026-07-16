import { api } from '@/lib/api';
import { Paginated, PurchaseOrder, PurchaseOrderFilters, PurchaseOrderOption, PurchaseOrderStatus } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const purchaseOrderKeys = {
    all: ['purchase-orders'] as const,
    lists: () => [...purchaseOrderKeys.all, 'list'] as const,
    list: (filters: PurchaseOrderFilters) => [...purchaseOrderKeys.lists(), filters] as const,
    detail: (id: string) => [...purchaseOrderKeys.all, 'detail', id] as const,
    options: (supplierId?: string) => [...purchaseOrderKeys.all, 'options', supplierId ?? null] as const,
};

export interface PurchaseLinePayload {
    product_id: string;
    product_variant_id: string | null;
    quantity: string;
    unit_cost: string;
    tax_amount: string;
    discount_amount: string;
}

/**
 * Money is deliberately absent: the server computes every total from the lines and
 * rejects nothing but ignores anything else sent here.
 */
export interface PurchaseOrderPayload {
    branch_id: string;
    warehouse_id: string;
    supplier_id: string;
    order_date: string | null;
    expected_date: string | null;
    status: PurchaseOrderStatus;
    notes: string;
    details: PurchaseLinePayload[];
}

export function usePurchaseOrders(filters: PurchaseOrderFilters) {
    return useQuery({
        queryKey: purchaseOrderKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<PurchaseOrder>>('/api/purchase-orders', {
                search: filters.search,
                status: filters.status,
                supplier_id: filters.supplier_id === 'all' ? undefined : filters.supplier_id,
                warehouse_id: filters.warehouse_id === 'all' ? undefined : filters.warehouse_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** A single order with its lines, used to hydrate the edit and receive sheets. */
export function usePurchaseOrder(id: string) {
    return useQuery({
        queryKey: purchaseOrderKeys.detail(id),
        queryFn: () => api.get<{ data: PurchaseOrder }>(`/api/purchase-orders/${id}`),
        select: (response) => response.data,
        enabled: id !== '',
    });
}

/** Orders for selection inputs (the return form's PO dropdown). */
export function usePurchaseOrderOptions(supplierId?: string) {
    return useQuery({
        queryKey: purchaseOrderKeys.options(supplierId),
        queryFn: () => api.get<{ data: PurchaseOrderOption[] }>('/api/purchase-orders/options', { supplier_id: supplierId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}

export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PurchaseOrderPayload) => api.post<{ data: PurchaseOrder }>('/api/purchase-orders', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
    });
}

export function useUpdatePurchaseOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: PurchaseOrderPayload & { id: string }) =>
            api.put<{ data: PurchaseOrder }>(`/api/purchase-orders/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
    });
}

export interface ReceiveLinePayload {
    purchase_detail_id: string;
    received_qty: string;
}

export function useReceivePurchaseOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, lines }: { id: string; lines: ReceiveLinePayload[] }) =>
            api.post<{ data: PurchaseOrder }>(`/api/purchase-orders/${id}/receive`, { lines }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
    });
}

export function useDeletePurchaseOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/purchase-orders/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
    });
}
