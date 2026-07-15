import { api } from '@/lib/api';
import { CustomerGroupOption } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const customerGroupKeys = {
    all: ['customer-groups'] as const,
    options: (companyId?: string) => [...customerGroupKeys.all, 'options', companyId ?? null] as const,
};

/**
 * Customer groups for the customer form's group dropdown. Groups have no CRUD
 * screen yet, so this options query is the only reader.
 */
export function useCustomerGroupOptions(companyId?: string) {
    return useQuery({
        queryKey: customerGroupKeys.options(companyId),
        queryFn: () => api.get<{ data: CustomerGroupOption[] }>('/api/customer-groups/options', { company_id: companyId }),
        select: (response) => response.data,
        staleTime: 60_000,
    });
}
