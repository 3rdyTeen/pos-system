import { api } from '@/lib/api';
import { Paginated, PaymentMethod, PaymentMethodFilters } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const paymentMethodKeys = {
    all: ['payment-methods'] as const,
    lists: () => [...paymentMethodKeys.all, 'list'] as const,
    list: (filters: PaymentMethodFilters) => [...paymentMethodKeys.lists(), filters] as const,
};

export function usePaymentMethods(filters: PaymentMethodFilters) {
    return useQuery({
        queryKey: paymentMethodKeys.list(filters),
        queryFn: () =>
            api.get<Paginated<PaymentMethod>>('/api/payment-methods', {
                search: filters.search,
                company_id: filters.company_id === 'all' ? undefined : filters.company_id,
                is_active: filters.is_active === 'all' ? undefined : filters.is_active,
                sort: filters.sort,
                direction: filters.direction,
                page: filters.page,
            }),
        placeholderData: keepPreviousData,
    });
}
