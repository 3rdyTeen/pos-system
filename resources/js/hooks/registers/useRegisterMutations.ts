import { api } from '@/lib/api';
import { Register } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerKeys } from './useRegisters';

export interface RegisterPayload {
    branch_id: string;
    name: string;
    code: string;
    ip_address: string;
    status: string;
}

export function useCreateRegister() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: RegisterPayload) => api.post<{ data: Register }>('/api/registers', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: registerKeys.all }),
    });
}

export function useUpdateRegister() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: RegisterPayload & { id: string }) => api.put<{ data: Register }>(`/api/registers/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: registerKeys.all }),
    });
}

export function useDeleteRegister() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/registers/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: registerKeys.all }),
    });
}
