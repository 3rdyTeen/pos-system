import { api } from '@/lib/api';
import { FeatureControls } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const featureControlKeys = {
    all: ['feature-controls'] as const,
    detail: (companyId?: string) => [...featureControlKeys.all, companyId ?? null] as const,
};

export function useFeatureControls(companyId?: string) {
    return useQuery({
        queryKey: featureControlKeys.detail(companyId),
        queryFn: () => api.get<{ data: FeatureControls }>('/api/feature-controls', { company_id: companyId }),
        select: (response) => response.data,
    });
}

export function useSaveFeatureControls() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ companyId, flags }: { companyId: string; flags: Record<string, boolean> }) =>
            api.put<{ data: FeatureControls }>('/api/feature-controls', { company_id: companyId, flags }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: featureControlKeys.all });
            // A capability going on or off reshapes the terminal and the catalogue.
            queryClient.invalidateQueries({ queryKey: ['pos'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
