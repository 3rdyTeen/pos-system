import { api } from '@/lib/api';
import { Navigation } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { navigationKeys } from './useNavigations';

export interface NavigationPayload {
    module_id: string;
    parent_id: string | null;
    name: string;
    code: string;
    icon: string | null;
    url: string;
    order: number | null;
}

export function useCreateNavigation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: NavigationPayload) => api.post<{ data: Navigation }>('/api/navigations', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: navigationKeys.all }),
    });
}

export function useUpdateNavigation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: NavigationPayload & { id: string }) => api.put<{ data: Navigation }>(`/api/navigations/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: navigationKeys.all }),
    });
}

export function useDeleteNavigation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/navigations/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: navigationKeys.all }),
    });
}
