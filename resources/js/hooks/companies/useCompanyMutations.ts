import { api } from '@/lib/api';
import { Company } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyKeys } from './useCompanies';

export interface CompanyPayload {
    name: string;
    legal_name: string;
    tax_id: string;
    email: string;
    phone: string;
    address: string;
    logo_url: string;
    default_currency: string;
    timezone: string;
    status: string;
}

export function useCreateCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CompanyPayload) => api.post<{ data: Company }>('/api/companies', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: companyKeys.all }),
    });
}

export function useUpdateCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: CompanyPayload & { id: string }) => api.put<{ data: Company }>(`/api/companies/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: companyKeys.all }),
    });
}

export function useDeleteCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/companies/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: companyKeys.all }),
    });
}
