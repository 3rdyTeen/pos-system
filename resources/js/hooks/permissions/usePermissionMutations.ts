import { api } from '@/lib/api';
import { Permission } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionKeys } from './usePermissionList';

export interface PermissionPayload {
    name: string;
    code: string;
    is_enabled: boolean;
}

export function useCreatePermission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PermissionPayload) => api.post<{ data: Permission }>('/api/permissions', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionKeys.all }),
    });
}

export function useUpdatePermission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: PermissionPayload & { id: string }) => api.put<{ data: Permission }>(`/api/permissions/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionKeys.all }),
    });
}

export function useTogglePermission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<{ data: Permission }>(`/api/permissions/${id}/toggle`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionKeys.all }),
    });
}

export function useDeletePermission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/permissions/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionKeys.all }),
    });
}
