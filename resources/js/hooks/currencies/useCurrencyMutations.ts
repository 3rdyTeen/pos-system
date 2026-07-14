import { api } from '@/lib/api';
import { Currency } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { currencyKeys } from './useCurrencies';

export interface CurrencyPayload {
    code: string;
    name: string;
    symbol: string;
    exchange_rate: string;
    is_base: boolean;
    status: string;
}

export function useCreateCurrency() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CurrencyPayload) => api.post<{ data: Currency }>('/api/currencies', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: currencyKeys.all }),
    });
}

export function useUpdateCurrency() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: CurrencyPayload & { id: string }) => api.put<{ data: Currency }>(`/api/currencies/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: currencyKeys.all }),
    });
}

export function useDeleteCurrency() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/currencies/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: currencyKeys.all }),
    });
}
