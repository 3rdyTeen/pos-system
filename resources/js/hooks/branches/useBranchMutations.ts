import { api } from '@/lib/api';
import { Branch } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { branchKeys } from './useBranches';

export interface BranchPayload {
    company_id: string;
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    is_main_branch: boolean;
    status: string;
}

export function useCreateBranch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: BranchPayload) => api.post<{ data: Branch }>('/api/branches', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
    });
}

export function useUpdateBranch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: BranchPayload & { id: string }) => api.put<{ data: Branch }>(`/api/branches/${id}`, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
    });
}

export function useDeleteBranch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ message: string }>(`/api/branches/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
    });
}
