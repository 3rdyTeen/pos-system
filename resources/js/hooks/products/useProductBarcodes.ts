import { api } from '@/lib/api';
import { ProductBarcode } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const productBarcodeKeys = {
    list: (productId: string) => ['products', productId, 'barcodes'] as const,
};

export interface ProductBarcodePayload {
    barcode: string;
    product_variant_id: string | null;
    product_unit_id: string | null;
    is_primary: boolean;
}

export function useProductBarcodes(productId: string) {
    return useQuery({
        queryKey: productBarcodeKeys.list(productId),
        queryFn: () => api.get<{ data: ProductBarcode[] }>(`/api/products/${productId}/barcodes`),
        select: (response) => response.data,
        enabled: productId !== '',
    });
}

export function useCreateProductBarcode(productId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ProductBarcodePayload) => api.post<{ data: ProductBarcode }>(`/api/products/${productId}/barcodes`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productBarcodeKeys.list(productId) }),
    });
}

export function useUpdateProductBarcode(productId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: ProductBarcodePayload & { id: string }) =>
            api.put<{ data: ProductBarcode }>(`/api/product-barcodes/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productBarcodeKeys.list(productId) }),
    });
}

export function useDeleteProductBarcode(productId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/product-barcodes/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productBarcodeKeys.list(productId) }),
    });
}
