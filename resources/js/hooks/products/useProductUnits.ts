import { api } from '@/lib/api';
import { ProductUnit } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const productUnitKeys = {
    list: (productId: string) => ['products', productId, 'units'] as const,
};

export interface ProductUnitPayload {
    unit_id: string;
    conversion_factor: string;
    is_base_unit: boolean;
}

export function useProductUnits(productId: string) {
    return useQuery({
        queryKey: productUnitKeys.list(productId),
        queryFn: () => api.get<{ data: ProductUnit[] }>(`/api/products/${productId}/units`),
        select: (response) => response.data,
    });
}

export function useCreateProductUnit(productId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ProductUnitPayload) => api.post<{ data: ProductUnit }>(`/api/products/${productId}/units`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productUnitKeys.list(productId) }),
    });
}

export function useUpdateProductUnit(productId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: ProductUnitPayload & { id: string }) => api.put<{ data: ProductUnit }>(`/api/product-units/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productUnitKeys.list(productId) }),
    });
}

export function useDeleteProductUnit(productId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/product-units/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productUnitKeys.list(productId) }),
    });
}
