import { api } from '@/lib/api';
import { Supplier, SupplierStatus } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierKeys } from './useSuppliers';

export interface SupplierPayload {
    company_id: string;
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    tax_id: string;
    status: SupplierStatus;
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: SupplierPayload) => api.post<{ data: Supplier }>('/api/suppliers', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
    });
}

export function useUpdateSupplier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: SupplierPayload & { id: string }) => api.put<{ data: Supplier }>(`/api/suppliers/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
    });
}

export function useDeleteSupplier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/suppliers/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
    });
}
