import { api } from '@/lib/api';
import { ProductOption } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { productKeys } from './useProducts';

/** Products for selection inputs (stock document line items), optionally scoped to a company. */
export function useProductOptions(companyId?: string) {
    return useQuery({
        queryKey: [...productKeys.all, 'options', companyId ?? null] as const,
        queryFn: () => api.get<{ data: ProductOption[] }>('/api/products/options', { company_id: companyId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
