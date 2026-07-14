import { api } from '@/lib/api';
import { Module } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleKeys } from './useModules';

export interface ModulePayload {
    name: string;
    code: string;
    is_enabled: boolean;
}

export function useCreateModule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ModulePayload) => api.post<{ data: Module }>('/api/modules', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: moduleKeys.all }),
    });
}

export function useUpdateModule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: ModulePayload & { id: string }) => api.put<{ data: Module }>(`/api/modules/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: moduleKeys.all }),
    });
}

export function useToggleModule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<{ data: Module }>(`/api/modules/${id}/toggle`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: moduleKeys.all }),
    });
}

export function useDeleteModule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/modules/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: moduleKeys.all }),
    });
}
