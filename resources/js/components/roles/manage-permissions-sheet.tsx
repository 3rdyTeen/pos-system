import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { rolePermissionKeys, useRolePermissions, useSaveRolePermissions } from '@/hooks/roles/useRolePermissions';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Role, RolePermissionMatrixModule } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface ManagePermissionsSheetProps {
    role: Role | null;
    onOpenChange: (open: boolean) => void;
}

type ModuleEnabled = Record<string, boolean>;
type ModuleOpen = Record<string, boolean>;
type PermissionGranted = Record<string, Record<string, boolean>>;

export function ManagePermissionsSheet({ role, onOpenChange }: ManagePermissionsSheetProps) {
    const queryClient = useQueryClient();
    const { data: matrix, isPending, isError, refetch } = useRolePermissions(role?.id ?? null);
    const saveMutation = useSaveRolePermissions();

    const [enabled, setEnabled] = useState<ModuleEnabled>({});
    const [granted, setGranted] = useState<PermissionGranted>({});
    const [openModules, setOpenModules] = useState<ModuleOpen>({});
    const [search, setSearch] = useState('');

    // Initialize local toggle state from the fetched matrix.
    useEffect(() => {
        if (!matrix) {
            return;
        }

        const nextEnabled: ModuleEnabled = {};
        const nextOpen: ModuleOpen = {};
        const nextGranted: PermissionGranted = {};

        for (const module of matrix) {
            nextEnabled[module.module_id] = module.granted;
            nextOpen[module.module_id] = false; // Collapsed by default.
            nextGranted[module.module_id] = {};
            for (const permission of module.permissions) {
                nextGranted[module.module_id][permission.permission_id] = permission.granted;
            }
        }

        setEnabled(nextEnabled);
        setOpenModules(nextOpen);
        setGranted(nextGranted);
        setSearch('');
    }, [matrix]);

    const toggleModule = (module: RolePermissionMatrixModule) => {
        const nextValue = !enabled[module.module_id];

        setEnabled((prev) => ({
            ...prev,
            [module.module_id]: nextValue,
        }));

        // Expand a module when it is turned on, collapse it when turned off.
        setOpenModules((prev) => ({
            ...prev,
            [module.module_id]: nextValue,
        }));
    };

    const setModuleOpen = (moduleId: string, open: boolean) => {
        setOpenModules((prev) => ({ ...prev, [moduleId]: open }));
    };

    // Filter modules by name or code so large module lists stay manageable.
    const visibleModules = useMemo(() => {
        if (!matrix) {
            return [];
        }

        const term = search.trim().toLowerCase();

        if (!term) {
            return matrix;
        }

        return matrix.filter((module) => module.name.toLowerCase().includes(term) || module.code.toLowerCase().includes(term));
    }, [matrix, search]);

    const togglePermission = (moduleId: string, permissionId: string) => {
        setGranted((prev) => ({
            ...prev,
            [moduleId]: { ...prev[moduleId], [permissionId]: !prev[moduleId]?.[permissionId] },
        }));
    };

    const save = () => {
        if (!role || !matrix) {
            return;
        }

        const payload = {
            modules: matrix.map((module) => ({
                module_id: module.module_id,
                enabled: !!enabled[module.module_id],
                permission_ids: module.permissions.filter((p) => granted[module.module_id]?.[p.permission_id]).map((p) => p.permission_id),
            })),
        };

        saveMutation.mutate(
            { roleId: role.id, payload },
            {
                onSuccess: () => {
                    toast.success('Permissions saved.');
                    queryClient.invalidateQueries({ queryKey: rolePermissionKeys.matrix(role.id) });
                    onOpenChange(false);
                },
                onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Failed to save permissions.'),
            },
        );
    };

    return (
        <Sheet open={role !== null} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
                <SheetHeader className="text-left">
                    <SheetTitle>Manage permissions</SheetTitle>
                    <SheetDescription>
                        Grant module access and permissions for <span className="text-foreground font-medium">{role?.name}</span>.
                    </SheetDescription>
                </SheetHeader>

                {matrix && matrix.length > 0 && (
                    <div className="relative mt-4">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search modules..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                            aria-label="Search modules"
                        />
                    </div>
                )}

                <div className="flex-1 space-y-3 overflow-y-auto py-4">
                    {isPending && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}

                    {isError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Failed to load permissions</AlertTitle>
                            <AlertDescription className="flex items-center gap-3">
                                Something went wrong.
                                <Button variant="outline" size="sm" onClick={() => refetch()}>
                                    Retry
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {matrix?.length === 0 && (
                        <p className="text-muted-foreground py-10 text-center text-sm">No enabled modules. Create and enable modules first.</p>
                    )}

                    {matrix && matrix.length > 0 && visibleModules.length === 0 && (
                        <p className="text-muted-foreground py-10 text-center text-sm">No modules match your search.</p>
                    )}

                    {visibleModules.map((module) => {
                        const moduleOn = !!enabled[module.module_id];

                        return (
                            <Collapsible
                                key={module.module_id}
                                open={!!openModules[module.module_id]}
                                onOpenChange={(open) => setModuleOpen(module.module_id, open)}
                                className="group/mod rounded-lg border"
                            >
                                <div className="flex items-center justify-between gap-2 p-3">
                                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                                        <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform group-data-[state=closed]/mod:-rotate-90" />
                                        {module.name}
                                        <code className="text-muted-foreground text-xs">{module.code}</code>
                                    </CollapsibleTrigger>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">Enable module</span>
                                        <Switch
                                            checked={moduleOn}
                                            onCheckedChange={() => toggleModule(module)}
                                            aria-label={`Enable ${module.name}`}
                                        />
                                    </div>
                                </div>

                                <CollapsibleContent className="space-y-1 border-t p-3">
                                    {module.permissions.map((permission) => (
                                        <div key={permission.permission_id} className="flex items-center justify-between gap-2 py-1">
                                            <div className="min-w-0">
                                                <p className="text-sm">{permission.name}</p>
                                                <code className="text-muted-foreground text-xs">{permission.generated_code}</code>
                                            </div>
                                            <Switch
                                                checked={!!granted[module.module_id]?.[permission.permission_id]}
                                                disabled={!moduleOn}
                                                onCheckedChange={() => togglePermission(module.module_id, permission.permission_id)}
                                                aria-label={permission.generated_code}
                                            />
                                        </div>
                                    ))}
                                    {module.permissions.length === 0 && (
                                        <p className="text-muted-foreground text-xs">No enabled permissions available.</p>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                </div>

                <SheetFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={save} disabled={saveMutation.isPending || isPending || isError}>
                        Save
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
