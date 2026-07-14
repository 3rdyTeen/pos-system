import { api } from '@/lib/api';
import { Paginated, Product, ProductFilters } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
};

export function useProducts(filters: ProductFilters) {
    return useQuery({
        queryKey: productKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Product>>('/api/products', {
                search: filters.search,
                status: filters.status,
                company_id: filters.company_id === 'all' ? undefined : filters.company_id,
                category_id: filters.category_id === 'all' ? undefined : filters.category_id,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}
