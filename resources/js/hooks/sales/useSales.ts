import { api } from '@/lib/api';
import { Paginated, Sale, SaleFilters, SaleOption, SaleStatus } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const saleKeys = {
    all: ['sales'] as const,
    lists: () => [...saleKeys.all, 'list'] as const,
    list: (filters: SaleFilters) => [...saleKeys.lists(), filters] as const,
    detail: (id: string) => [...saleKeys.all, 'detail', id] as const,
    held: (registerId?: string) => [...saleKeys.all, 'held', registerId ?? null] as const,
    options: (customerId?: string) => [...saleKeys.all, 'options', customerId ?? null] as const,
};

export interface SaleLinePayload {
    product_id: string;
    product_variant_id: string | null;
    unit_id: string | null;
    quantity: string;
    /**
     * Omitted to take the catalogue price. A configured line always omits it: its
     * displayed price is base + option deltas, and echoing that back would look
     * like a manual override of the catalogue.
     */
    unit_price?: string;
    discount_amount: string;
    /** Chosen option ids. The server reads their names and prices from the catalogue. */
    modifiers?: string[];
    /** Which option fills each combo slot. */
    components?: { combo_slot_option_id: string }[];
}

export interface SalePaymentPayload {
    payment_method_id: string;
    amount: string;
    reference_number?: string | null;
}

/**
 * Money is deliberately absent apart from unit_price and discount: the server
 * prices the cart from the catalogue and computes every total, so anything else
 * sent here would be ignored.
 */
export interface SalePayload {
    branch_id: string;
    register_id: string | null;
    shift_id: string | null;
    customer_id: string | null;
    order_type: string | null;
    status: SaleStatus;
    notes: string;
    lines: SaleLinePayload[];
    payments?: SalePaymentPayload[];
}

export function useSales(filters: SaleFilters) {
    return useQuery({
        queryKey: saleKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Sale>>('/api/sales', {
                search: filters.search,
                status: filters.status === 'all' ? undefined : filters.status,
                payment_status: filters.payment_status === 'all' ? undefined : filters.payment_status,
                register_id: filters.register_id === 'all' ? undefined : filters.register_id,
                from: filters.from,
                to: filters.to,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** A single sale with its lines, tenders and tax breakdown. */
export function useSale(id: string) {
    return useQuery({
        queryKey: saleKeys.detail(id),
        queryFn: () => api.get<{ data: Sale }>(`/api/sales/${id}`),
        select: (response) => response.data,
        enabled: id !== '',
    });
}

/** Carts parked on a register, for the terminal's resume list. */
export function useHeldSales(registerId?: string) {
    return useQuery({
        queryKey: saleKeys.held(registerId),
        queryFn: () => api.get<{ data: Sale[] }>('/api/sales/held', { register_id: registerId }),
        select: (response) => response.data,
    });
}

/** Completed sales for selection inputs (the return form's sale dropdown). */
export function useSaleOptions(customerId?: string) {
    return useQuery({
        queryKey: saleKeys.options(customerId),
        queryFn: () => api.get<{ data: SaleOption[] }>('/api/sales/options', { customer_id: customerId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}

export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: SalePayload) => api.post<{ data: Sale }>('/api/sales', payload),
        // Selling moves stock, so the inventory views are stale too.
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: saleKeys.all });
            queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
            queryClient.invalidateQueries({ queryKey: ['pos'] });
        },
    });
}

export function useUpdateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: Partial<SalePayload> & { id: string }) =>
            api.put<{ data: Sale }>(`/api/sales/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: saleKeys.all }),
    });
}

/** Take payment for a parked cart. This is what releases its stock. */
export function useCompleteSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payments }: { id: string; payments: SalePaymentPayload[] }) =>
            api.post<{ data: Sale }>(`/api/sales/${id}/complete`, { payments }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: saleKeys.all });
            queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
            queryClient.invalidateQueries({ queryKey: ['pos'] });
        },
    });
}

/** Reverse a completed sale, returning its stock. */
export function useVoidSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.post<{ data: Sale }>(`/api/sales/${id}/void`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: saleKeys.all });
            queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
        },
    });
}

/** Discard a parked cart. A completed sale is voided instead. */
export function useDeleteSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/sales/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: saleKeys.all }),
    });
}
