import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { ManagePermissionsSheet } from '@/components/roles/manage-permissions-sheet';
import { RoleDeleteDialog } from '@/components/roles/role-delete-dialog';
import { RoleSheet } from '@/components/roles/role-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToggleRole } from '@/hooks/roles/useRoleMutations';
import { useRoles } from '@/hooks/roles/useRoles';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Role, RoleFilters, StatusFilter, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Roles', href: '/roles' }];

const COLUMN_COUNT = 6;

const DEFAULT_FILTERS: RoleFilters = {
    search: '',
    status: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function Roles() {
    const [filters, setFilters] = useState<RoleFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const [managingRole, setManagingRole] = useState<Role | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useRoles(filters);
    const toggleRole = useToggleRole();

    // Debounce the search input into the query filters.
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

    const handleToggle = (role: Role) => {
        toggleRole.mutate(role.id, {
            onSuccess: () => toast.success(role.is_enabled ? 'Role disabled.' : 'Role enabled.'),
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Failed to update role.'),
        });
    };

    const openCreate = () => {
        setEditingRole(null);
        setSheetOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditingRole(role);
        setSheetOpen(true);
    };

    const roles = data?.data ?? [];
    const isEmpty = !isPending && !isError && roles.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Roles</h1>
                        <p className="text-muted-foreground text-sm">Manage the roles that can be assigned to users.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New role
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search roles..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
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
                                <TableHead>Description</TableHead>
                                <SortableHeader
                                    label="Status"
                                    column="is_enabled"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <TableHead>Users</TableHead>
                                <SortableHeader
                                    label="Created"
                                    column="created_at"
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
                                            <AlertTitle>Failed to load roles</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching roles.
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
                                        No roles found. Create your first role to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs truncate">{role.description || '—'}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={role.is_enabled}
                                            onCheckedChange={() => handleToggle(role)}
                                            disabled={toggleRole.isPending}
                                            aria-label={role.is_enabled ? 'Disable role' : 'Enable role'}
                                        />
                                    </TableCell>
                                    <TableCell className="tabular-nums">{role.users_count ?? 0}</TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(role.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="outline" size="sm" onClick={() => setManagingRole(role)} aria-label="Manage permissions">
                                                <ShieldCheck className="h-4 w-4" />
                                                Permissions
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(role)} aria-label="Edit role">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingRole(role)} aria-label="Delete role">
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

            <RoleSheet open={sheetOpen} onOpenChange={setSheetOpen} role={editingRole} />
            <RoleDeleteDialog role={deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)} />
            <ManagePermissionsSheet role={managingRole} onOpenChange={(open) => !open && setManagingRole(null)} />
        </AppLayout>
    );
}
