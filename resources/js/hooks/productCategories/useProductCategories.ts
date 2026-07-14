import { api } from '@/lib/api';
import { Paginated, ProductCategory, ProductCategoryFilters, ProductCategoryOption } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const productCategoryKeys = {
    all: ['product-categories'] as const,
    lists: () => [...productCategoryKeys.all, 'list'] as const,
    list: (filters: ProductCategoryFilters) => [...productCategoryKeys.lists(), filters] as const,
    options: (companyId?: string) => [...productCategoryKeys.all, 'options', companyId ?? null] as const,
};

export function useProductCategories(filters: ProductCategoryFilters) {
    return useQuery({
        queryKey: productCategoryKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<ProductCategory>>('/api/product-categories', {
                search: filters.search,
                status: filters.status,
                company_id: filters.company_id === 'all' ? undefined : filters.company_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}

/** Categories for selection inputs (parent/product category dropdowns), optionally scoped to a company. */
export function useProductCategoryOptions(companyId?: string) {
    return useQuery({
        queryKey: productCategoryKeys.options(companyId),
        queryFn: () => api.get<{ data: ProductCategoryOption[] }>('/api/product-categories/options', { company_id: companyId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
