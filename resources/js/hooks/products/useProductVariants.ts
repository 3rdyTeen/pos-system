import { api } from '@/lib/api';
import { ProductVariant } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const productVariantKeys = {
    list: (productId: string) => ['products', productId, 'variants'] as const,
};

export interface ProductVariantPayload {
    variant_name: string;
    sku: string;
    attributes: Record<string, string>;
    cost_price: string;
    selling_price: string;
}

export function useProductVariants(productId: string) {
    return useQuery({
        queryKey: productVariantKeys.list(productId),
        queryFn: () => api.get<{ data: ProductVariant[] }>(`/api/products/${productId}/variants`),
        select: (response) => response.data,
        enabled: productId !== '',
    });
}

export function useCreateProductVariant(productId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ProductVariantPayload) => api.post<{ data: ProductVariant }>(`/api/products/${productId}/variants`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productVariantKeys.list(productId) }),
    });
}

export function useUpdateProductVariant(productId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: ProductVariantPayload & { id: string }) =>
            api.put<{ data: ProductVariant }>(`/api/product-variants/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productVariantKeys.list(productId) }),
    });
}

export function useDeleteProductVariant(productId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/product-variants/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productVariantKeys.list(productId) }),
    });
}
