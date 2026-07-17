import { api } from '@/lib/api';
import { Paginated, OrderType, PickingMode, PosProfile, PosProfileFilters } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { posKeys } from '@/hooks/pos/usePosTerminal';

export const posProfileKeys = {
    all: ['pos-profiles'] as const,
    lists: () => [...posProfileKeys.all, 'list'] as const,
    list: (filters: PosProfileFilters) => [...posProfileKeys.lists(), filters] as const,
    options: () => [...posProfileKeys.all, 'options'] as const,
};

export interface PosProfilePayload {
    company_id: string;
    name: string;
    code: string | null;
    picking_mode: PickingMode;
    order_types: OrderType[];
    default_order_type: OrderType | null;
    quick_tender: number[];
    require_customer: boolean;
    allow_held_orders: boolean;
    allow_negative_stock: boolean;
    is_default: boolean;
    status: 'active' | 'inactive';
}

export function usePosProfiles(filters: PosProfileFilters) {
    return useQuery({
        queryKey: posProfileKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<PosProfile>>('/api/pos-profiles', {
                search: filters.search,
                status: filters.status === 'all' ? undefined : filters.status,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** Profiles for selection inputs (the register form's profile dropdown). */
export function usePosProfileOptions() {
    return useQuery({
        queryKey: posProfileKeys.options(),
        queryFn: () => api.get<{ data: PosProfile[] }>('/api/pos-profiles/options'),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}

export function useCreatePosProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PosProfilePayload) => api.post<{ data: PosProfile }>('/api/pos-profiles', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: posProfileKeys.all });
            // A profile change reshapes any terminal running under it.
            queryClient.invalidateQueries({ queryKey: posKeys.all });
        },
    });
}

export function useUpdatePosProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: PosProfilePayload & { id: string }) =>
            api.put<{ data: PosProfile }>(`/api/pos-profiles/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: posProfileKeys.all });
            queryClient.invalidateQueries({ queryKey: posKeys.all });
        },
    });
}

export function useDeletePosProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/pos-profiles/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: posProfileKeys.all });
            queryClient.invalidateQueries({ queryKey: posKeys.all });
        },
    });
}
