import { api } from '@/lib/api';
import { PurchasePayment } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderKeys } from './usePurchaseOrders';

export const purchasePaymentKeys = {
    list: (orderId: string) => ['purchase-orders', orderId, 'payments'] as const,
};

export interface PurchasePaymentPayload {
    payment_method_id: string;
    amount: string;
    reference_number: string;
}

export function usePurchasePayments(orderId: string) {
    return useQuery({
        queryKey: purchasePaymentKeys.list(orderId),
        queryFn: () => api.get<{ data: PurchasePayment[] }>(`/api/purchase-orders/${orderId}/payments`),
        select: (response) => response.data,
        enabled: orderId !== '',
    });
}

export function useCreatePurchasePayment(orderId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PurchasePaymentPayload) => api.post<{ data: PurchasePayment }>(`/api/purchase-orders/${orderId}/payments`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchasePaymentKeys.list(orderId) });
            // The order's paid_total and balance move with it.
            queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
        },
    });
}

export function useDeletePurchasePayment(orderId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/purchase-payments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchasePaymentKeys.list(orderId) });
            queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
        },
    });
}
