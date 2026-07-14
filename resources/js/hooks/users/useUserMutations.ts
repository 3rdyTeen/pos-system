import { api } from '@/lib/api';
import { AdminUser } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from './useUsers';

export interface UserPayload {
    name: string;
    email: string;
    password?: string;
    role_id: string;
    is_enabled: boolean;
    image?: File | null;
}

function toFormData(payload: UserPayload): FormData {
    const form = new FormData();

    form.append('name', payload.name);
    form.append('email', payload.email);
    form.append('role_id', payload.role_id);
    form.append('is_enabled', payload.is_enabled ? '1' : '0');

    if (payload.password) {
        form.append('password', payload.password);
    }

    if (payload.image) {
        form.append('image', payload.image);
    }

    return form;
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UserPayload) => api.post<{ data: AdminUser }>('/api/users', toFormData(payload)),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: UserPayload & { id: string }) => api.put<{ data: AdminUser }>(`/api/users/${id}`, toFormData(payload)),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
    });
}

export function useToggleUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<{ data: AdminUser }>(`/api/users/${id}/toggle`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/users/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
    });
}
