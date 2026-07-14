import { api } from '@/lib/api';
import { Role } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleKeys } from './useRoles';

export interface RolePayload {
    name: string;
    description: string;
    is_enabled: boolean;
}

export function useCreateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: RolePayload) => api.post<{ data: Role }>('/api/roles', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
    });
}

export function useUpdateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: RolePayload & { id: string }) => api.put<{ data: Role }>(`/api/roles/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
    });
}

export function useToggleRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<{ data: Role }>(`/api/roles/${id}/toggle`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
    });
}

export function useDeleteRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/roles/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
    });
}
