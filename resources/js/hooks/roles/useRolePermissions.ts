import { api } from '@/lib/api';
import { RolePermissionMatrixModule } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';

export const rolePermissionKeys = {
    matrix: (roleId: string) => ['roles', roleId, 'permissions'] as const,
};

export function useRolePermissions(roleId: string | null) {
    return useQuery({
        queryKey: rolePermissionKeys.matrix(roleId ?? 'none'),
        queryFn: () => api.get<{ data: RolePermissionMatrixModule[] }>(`/api/roles/${roleId}/permissions`),
        select: (response) => response.data,
        enabled: roleId !== null,
    });
}

export interface SaveRolePermissionsPayload {
    modules: { module_id: string; enabled: boolean; permission_ids: string[] }[];
}

export function useSaveRolePermissions() {
    return useMutation({
        mutationFn: ({ roleId, payload }: { roleId: string; payload: SaveRolePermissionsPayload }) =>
            api.post<{ message: string }>(`/api/roles/${roleId}/permissions`, payload),
    });
}
