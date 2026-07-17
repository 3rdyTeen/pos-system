import { api } from '@/lib/api';
import { ComboSlot, ModifierGroup, ModifierGroupFilters, ModifierSelectionType, Paginated } from '@/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const modifierGroupKeys = {
    all: ['modifier-groups'] as const,
    lists: () => [...modifierGroupKeys.all, 'list'] as const,
    list: (filters: ModifierGroupFilters) => [...modifierGroupKeys.lists(), filters] as const,
    detail: (id: string) => [...modifierGroupKeys.all, 'detail', id] as const,
    options: () => [...modifierGroupKeys.all, 'options'] as const,
};

export const comboSlotKeys = {
    all: ['combo-slots'] as const,
    forProduct: (productId: string) => [...comboSlotKeys.all, productId] as const,
};

export interface ModifierOptionPayload {
    id?: string | null;
    name: string;
    price_delta: string;
    product_id: string | null;
    is_default: boolean;
}

export interface ModifierGroupPayload {
    company_id: string;
    name: string;
    selection_type: ModifierSelectionType;
    is_required: boolean;
    min_select: number;
    max_select: number | null;
    status: 'active' | 'inactive';
    options: ModifierOptionPayload[];
    /** Omit to leave the product attachments alone; send a list to replace them. */
    product_ids?: string[];
}

export function useModifierGroups(filters: ModifierGroupFilters) {
    return useQuery({
        queryKey: modifierGroupKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<ModifierGroup>>('/api/modifier-groups', {
                search: filters.search,
                status: filters.status === 'all' ? undefined : filters.status,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** A single group with its options and the products it is attached to. */
export function useModifierGroup(id: string) {
    return useQuery({
        queryKey: modifierGroupKeys.detail(id),
        queryFn: () => api.get<{ data: ModifierGroup }>(`/api/modifier-groups/${id}`),
        select: (response) => response.data,
        enabled: id !== '',
    });
}

/** Groups for selection inputs (the product page's attach dropdown). */
export function useModifierGroupOptions() {
    return useQuery({
        queryKey: modifierGroupKeys.options(),
        queryFn: () => api.get<{ data: ModifierGroup[] }>('/api/modifier-groups/options'),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}

export function useCreateModifierGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ModifierGroupPayload) => api.post<{ data: ModifierGroup }>('/api/modifier-groups', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all });
            queryClient.invalidateQueries({ queryKey: ['pos'] });
        },
    });
}

export function useUpdateModifierGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: Partial<ModifierGroupPayload> & { id: string }) =>
            api.put<{ data: ModifierGroup }>(`/api/modifier-groups/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all });
            queryClient.invalidateQueries({ queryKey: ['pos'] });
        },
    });
}

export function useDeleteModifierGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/modifier-groups/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all });
            queryClient.invalidateQueries({ queryKey: ['pos'] });
        },
    });
}

/* Combo slots, managed on the product detail page. */

export interface ComboSlotPayload {
    name: string;
    quantity: string;
    is_swappable: boolean;
    options: { product_id: string; price_delta: string; is_default: boolean }[];
}

export function useComboSlots(productId: string, enabled = true) {
    return useQuery({
        queryKey: comboSlotKeys.forProduct(productId),
        queryFn: () => api.get<{ data: ComboSlot[] }>(`/api/products/${productId}/combo-slots`),
        select: (response) => response.data,
        enabled: enabled && productId !== '',
    });
}

export function useSaveComboSlots() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ productId, slots }: { productId: string; slots: ComboSlotPayload[] }) =>
            api.put<{ data: ComboSlot[] }>(`/api/products/${productId}/combo-slots`, { slots }),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: comboSlotKeys.forProduct(variables.productId) });
            queryClient.invalidateQueries({ queryKey: ['pos'] });
        },
    });
}
