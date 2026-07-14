import { api } from '@/lib/api';
import { PaymentMethod } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentMethodKeys } from './usePaymentMethods';

export interface PaymentMethodPayload {
    company_id: string;
    name: string;
    type: string;
    is_active: boolean;
}

export function useCreatePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PaymentMethodPayload) => api.post<{ data: PaymentMethod }>('/api/payment-methods', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all }),
    });
}

export function useUpdatePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: PaymentMethodPayload & { id: string }) =>
            api.put<{ data: PaymentMethod }>(`/api/payment-methods/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all }),
    });
}

export function useDeletePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/payment-methods/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all }),
    });
}
