import { api } from '@/lib/api';
import { Paginated, SalesReturn, SalesReturnFilters, SalesReturnStatus } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { saleKeys } from '@/hooks/sales/useSales';

export const salesReturnKeys = {
    all: ['sales-returns'] as const,
    lists: () => [...salesReturnKeys.all, 'list'] as const,
    list: (filters: SalesReturnFilters) => [...salesReturnKeys.lists(), filters] as const,
    detail: (id: string) => [...salesReturnKeys.all, 'detail', id] as const,
};

export interface SalesReturnLinePayload {
    sales_detail_id: string;
    quantity: string;
}

/**
 * Neither unit_price nor total_amount is sent: a refund pays back what was charged,
 * so the server reads the price off the original sale line.
 */
export interface SalesReturnPayload {
    sale_id: string;
    return_date: string | null;
    reason: string;
    refund_method: string | null;
    status: SalesReturnStatus;
    lines: SalesReturnLinePayload[];
}

export function useSalesReturns(filters: SalesReturnFilters) {
    return useQuery({
        queryKey: salesReturnKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<SalesReturn>>('/api/sales-returns', {
                search: filters.search,
                status: filters.status === 'all' ? undefined : filters.status,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

export function useSalesReturn(id: string) {
    return useQuery({
        queryKey: salesReturnKeys.detail(id),
        queryFn: () => api.get<{ data: SalesReturn }>(`/api/sales-returns/${id}`),
        select: (response) => response.data,
        enabled: id !== '',
    });
}

export function useCreateSalesReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: SalesReturnPayload) => api.post<{ data: SalesReturn }>('/api/sales-returns', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesReturnKeys.all });
            // A completed return restocks and blocks the sale from being voided.
            queryClient.invalidateQueries({ queryKey: saleKeys.all });
            queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
        },
    });
}

export function useUpdateSalesReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: Partial<SalesReturnPayload> & { id: string }) =>
            api.put<{ data: SalesReturn }>(`/api/sales-returns/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesReturnKeys.all });
            queryClient.invalidateQueries({ queryKey: saleKeys.all });
            queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
        },
    });
}

export function useDeleteSalesReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/sales-returns/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesReturnKeys.all });
            queryClient.invalidateQueries({ queryKey: saleKeys.all });
        },
    });
}
