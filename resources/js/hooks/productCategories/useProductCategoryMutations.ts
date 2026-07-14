import { api } from '@/lib/api';
import { ProductCategory } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productCategoryKeys } from './useProductCategories';

export interface ProductCategoryPayload {
    company_id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    status: string;
}

export function useCreateProductCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ProductCategoryPayload) => api.post<{ data: ProductCategory }>('/api/product-categories', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productCategoryKeys.all }),
    });
}

export function useUpdateProductCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: ProductCategoryPayload & { id: string }) =>
            api.put<{ data: ProductCategory }>(`/api/product-categories/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productCategoryKeys.all }),
    });
}

export function useDeleteProductCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/product-categories/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productCategoryKeys.all }),
    });
}
