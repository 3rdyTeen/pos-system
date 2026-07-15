import { api } from '@/lib/api';
import { Customer, CustomerStatus } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerKeys } from './useCustomers';

export interface CustomerPayload {
    company_id: string;
    customer_group_id: string | null;
    name: string;
    email: string;
    phone: string;
    address: string;
    tax_id: string;
    credit_limit: string;
    status: CustomerStatus;
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CustomerPayload) => api.post<{ data: Customer }>('/api/customers', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: CustomerPayload & { id: string }) => api.put<{ data: Customer }>(`/api/customers/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/customers/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
    });
}
