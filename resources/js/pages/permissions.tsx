import { ConfirmDeleteDialog } from '@/components/admin/confirm-delete-dialog';
import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { PermissionSheet } from '@/components/permissions/permission-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermissionList } from '@/hooks/permissions/usePermissionList';
import { useDeletePermission, useTogglePermission } from '@/hooks/permissions/usePermissionMutations';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Permission, PermissionFilters, StatusFilter } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const COLUMN_COUNT = 4;

const DEFAULT_FILTERS: PermissionFilters = {
    search: '',
    status: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function Permissions() {
    const [filters, setFilters] = useState<PermissionFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<Permission | null>(null);
    const [deleting, setDeleting] = useState<Permission | null>(null);

    const { data, isPending, isError, isFetching, refetch } = usePermissionList(filters);
    const togglePermission = useTogglePermission();
    const deletePermission = useDeletePermission();

    useEffect(() => {
        const handle = setTimeout(() => {
            setFilters((prev) => (prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 }));
        }, 300);
        return () => clearTimeout(handle);
    }, [searchInput]);

    const handleSort = (column: string) => {
        setFilters((prev) => ({
            ...prev,
            sort: column,
            direction: prev.sort === column && prev.direction === 'asc' ? 'desc' : 'asc',
            page: 1,
        }));
    };

    const handleToggle = (permission: Permission) => {
        togglePermission.mutate(permission.id, {
            onSuccess: () => toast.success(permission.is_enabled ? 'Permission disabled.' : 'Permission enabled.'),
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Failed to update permission.'),
        });
    };

    const confirmDelete = () => {
        if (!deleting) return;
        deletePermission.mutate(deleting.id, {
            onSuccess: () => {
                toast.success('Permission deleted.');
                setDeleting(null);
            },
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Failed to delete permission.'),
        });
    };

    const openCreate = () => {
        setEditing(null);
        setSheetOpen(true);
    };
    const openEdit = (permission: Permission) => {
        setEditing(permission);
        setSheetOpen(true);
    };

    const permissions = data?.data ?? [];
    const isEmpty = !isPending && !isError && permissions.length === 0;

    return (
        <AppLayout>
            <Head title="Permissions" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Permissions</h1>
                        <p className="text-muted-foreground text-sm">Manage the reusable permission actions.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New permission
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search permissions..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={filters.status}
                        onValueChange={(value: StatusFilter) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="Name" column="name" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <SortableHeader label="Code" column="code" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <SortableHeader
                                    label="Enabled"
                                    column="is_enabled"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isPending &&
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                                            <TableCell key={j}>
                                                <Skeleton className="h-5 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}

                            {isError && (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_COUNT}>
                                        <Alert variant="destructive" className="border-0">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Failed to load permissions</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong.
                                                <Button variant="outline" size="sm" onClick={() => refetch()}>
                                                    Retry
                                                </Button>
                                            </AlertDescription>
                                        </Alert>
                                    </TableCell>
                                </TableRow>
                            )}

                            {isEmpty && (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_COUNT} className="text-muted-foreground py-10 text-center">
                                        No permissions found. Create your first permission to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {permissions.map((permission) => (
                                <TableRow key={permission.id}>
                                    <TableCell className="font-medium">{permission.name}</TableCell>
                                    <TableCell>
                                        <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{permission.code}</code>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={permission.is_enabled}
                                            onCheckedChange={() => handleToggle(permission)}
                                            disabled={togglePermission.isPending}
                                            aria-label={permission.is_enabled ? 'Disable permission' : 'Enable permission'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(permission)} aria-label="Edit permission">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleting(permission)}
                                                aria-label="Delete permission"
                                            >
                                                <Trash2 className="text-destructive h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {data && (
                    <TablePagination meta={data.meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} isFetching={isFetching} />
                )}
            </div>

            <PermissionSheet open={sheetOpen} onOpenChange={setSheetOpen} permission={editing} />
            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete permission"
                description={
                    <>
                        Are you sure you want to delete <span className="text-foreground font-medium">{deleting?.name}</span>? Role grants using it
                        will be removed.
                    </>
                }
                confirmLabel="Delete permission"
                onConfirm={confirmDelete}
                isPending={deletePermission.isPending}
            />
        </AppLayout>
    );
}
