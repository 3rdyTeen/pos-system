import { api } from '@/lib/api';
import { Tax } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taxKeys } from './useTaxes';

export interface TaxPayload {
    company_id: string;
    name: string;
    rate: string;
    type: string;
    is_inclusive: boolean;
    status: string;
}

export function useCreateTax() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: TaxPayload) => api.post<{ data: Tax }>('/api/taxes', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: taxKeys.all }),
    });
}

export function useUpdateTax() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: TaxPayload & { id: string }) => api.put<{ data: Tax }>(`/api/taxes/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: taxKeys.all }),
    });
}

export function useDeleteTax() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/taxes/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: taxKeys.all }),
    });
}
