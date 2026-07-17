import { api, ApiError } from '@/lib/api';
import { PosContext, PosProduct, Shift, ShiftReconciliation } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const posKeys = {
    all: ['pos'] as const,
    context: (registerId?: string) => [...posKeys.all, 'context', registerId ?? null] as const,
    products: (search: string, categoryId: string, warehouseId?: string) =>
        [...posKeys.all, 'products', search, categoryId, warehouseId ?? null] as const,
    shift: (registerId?: string) => [...posKeys.all, 'shift', registerId ?? null] as const,
};

interface ShiftResponse {
    data: Shift | null;
    reconciliation: ShiftReconciliation | null;
}

/**
 * Boots the terminal: which register, under what configuration, with what tenders,
 * and whether a drawer is already open.
 */
export function usePosContext(registerId?: string) {
    return useQuery({
        queryKey: posKeys.context(registerId),
        queryFn: () => api.get<{ data: PosContext }>('/api/pos/context', { register_id: registerId }),
        select: (response) => response.data,
    });
}

/** The sellable catalogue, for the tile grid and the search box. */
export function usePosProducts(search: string, categoryId: string, warehouseId?: string) {
    return useQuery({
        queryKey: posKeys.products(search, categoryId, warehouseId),
        queryFn: () =>
            api.get<{ data: PosProduct[] }>('/api/pos/products', {
                search,
                category_id: categoryId === 'all' ? undefined : categoryId,
                warehouse_id: warehouseId,
            }),
        select: (response) => response.data,
        placeholderData: keepPreviousData,
    });
}

/** The open shift on a register. A null `data` is a normal answer, not an error. */
export function useCurrentShift(registerId?: string) {
    return useQuery({
        queryKey: posKeys.shift(registerId),
        queryFn: () => api.get<ShiftResponse>('/api/shifts/current', { register_id: registerId }),
        enabled: Boolean(registerId),
    });
}

/**
 * Resolves a scan to a sellable line.
 *
 * Imperative rather than a query: a scan is an event, and the same barcode scanned
 * twice must hit the server twice rather than being served from cache.
 */
export function useBarcodeLookup() {
    return useMutation({
        mutationFn: ({ barcode, warehouseId }: { barcode: string; warehouseId?: string }) =>
            api.get<{ data: PosProduct }>('/api/pos/lookup', { barcode, warehouse_id: warehouseId }),
        // A miss is a 404 by design; let the caller decide how to beep about it.
        throwOnError: false,
    });
}

export function useOpenShift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: { register_id: string; opening_balance: string; notes?: string | null }) =>
            api.post<ShiftResponse>('/api/shifts', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: posKeys.all }),
    });
}

export function useCloseShift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: { id: string; closing_balance: string | null; notes?: string | null }) =>
            api.post<ShiftResponse>(`/api/shifts/${id}/close`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: posKeys.all }),
    });
}

export { ApiError };
