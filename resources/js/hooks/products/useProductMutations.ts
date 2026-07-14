import { api } from '@/lib/api';
import { Product } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productKeys } from './useProducts';

export interface ProductPayload {
    company_id: string;
    category_id: string | null;
    name: string;
    sku: string;
    description: string;
    brand: string;
    base_unit_id: string | null;
    tax_id: string | null;
    cost_price: string;
    selling_price: string;
    reorder_level: string;
    is_active: boolean;
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ProductPayload) => api.post<{ data: Product }>('/api/products', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: ProductPayload & { id: string }) => api.put<{ data: Product }>(`/api/products/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/products/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
    });
}
