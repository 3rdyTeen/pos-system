import { api } from '@/lib/api';
import { Unit } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unitKeys } from './useUnits';

export interface UnitPayload {
    company_id: string;
    name: string;
    abbreviation: string;
    base_unit_id: string | null;
    conversion_factor: string;
}

export function useCreateUnit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UnitPayload) => api.post<{ data: Unit }>('/api/units', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: unitKeys.all }),
    });
}

export function useUpdateUnit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: UnitPayload & { id: string }) => api.put<{ data: Unit }>(`/api/units/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: unitKeys.all }),
    });
}

export function useDeleteUnit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/units/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: unitKeys.all }),
    });
}
