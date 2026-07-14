import { api } from '@/lib/api';
import { Currency, CurrencyFilters, Paginated } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const currencyKeys = {
    all: ['currencies'] as const,
    lists: () => [...currencyKeys.all, 'list'] as const,
    list: (filters: CurrencyFilters) => [...currencyKeys.lists(), filters] as const,
};

export function useCurrencies(filters: CurrencyFilters) {
    return useQuery({
        queryKey: currencyKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<Currency>>('/api/currencies', {
                search: filters.search,
                status: filters.status,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}
