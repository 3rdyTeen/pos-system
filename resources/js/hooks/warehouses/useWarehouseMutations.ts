import { api } from '@/lib/api';
import { Warehouse, WarehouseStatus } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseKeys } from './useWarehouses';

export interface WarehousePayload {
    branch_id: string;
    name: string;
    code: string;
    address: string;
    is_default: boolean;
    status: WarehouseStatus;
}

export function useCreateWarehouse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: WarehousePayload) => api.post<{ data: Warehouse }>('/api/warehouses', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
    });
}

export function useUpdateWarehouse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: WarehousePayload & { id: string }) => api.put<{ data: Warehouse }>(`/api/warehouses/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
    });
}

export function useDeleteWarehouse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/warehouses/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
    });
}
