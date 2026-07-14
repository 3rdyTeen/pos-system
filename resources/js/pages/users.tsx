import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Toggle } from '@/components/ui/toggle';
import { UserDeleteDialog } from '@/components/users/user-delete-dialog';
import { UserSheet } from '@/components/users/user-sheet';
import { useEnabledRoles } from '@/hooks/roles/useRoles';
import { useInitials } from '@/hooks/use-initials';
import { useToggleUser } from '@/hooks/users/useUserMutations';
import { useUsers } from '@/hooks/users/useUsers';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { AdminUser, StatusFilter, UserFilters, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '/users' }];

const COLUMN_COUNT = 6;

const DEFAULT_FILTERS: UserFilters = {
    search: '',
    status: 'all',
    role_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function Users() {
    const getInitials = useInitials();
    const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useUsers(filters);
    const { data: enabledRoles = [] } = useEnabledRoles();
    const toggleUser = useToggleUser();

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

    const handleToggle = (user: AdminUser) => {
        toggleUser.mutate(user.id, {
            onSuccess: () => toast.success(user.is_enabled ? 'User disabled.' : 'User enabled.'),
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Failed to update user.'),
        });
    };

    const openCreate = () => {
        setEditingUser(null);
        setSheetOpen(true);
    };

    const openEdit = (user: AdminUser) => {
        setEditingUser(user);
        setSheetOpen(true);
    };

    const users = data?.data ?? [];
    const isEmpty = !isPending && !isError && users.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Users</h1>
                        <p className="text-muted-foreground text-sm">Manage user accounts and their roles.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New user
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search users..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filters.role_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, role_id: value, page: 1 }))}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            {enabledRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                                <SortableHeader label="Email" column="email" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Role</TableHead>
                                <SortableHeader
                                    label="Status"
                                    column="is_enabled"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
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
                                            <AlertTitle>Failed to load users</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching users.
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
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.profile_image_url ?? undefined} alt={user.name} />
                                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        {user.role ? (
                                            <span className="inline-flex items-center gap-2">
                                                {user.role.name}
                                                {!user.role.is_enabled && (
                                                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                                                        disabled
                                                    </Badge>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_enabled ? 'success' : 'secondary'}>{user.is_enabled ? 'Enabled' : 'Disabled'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Toggle
                                                size="sm"
                                                variant="outline"
                                                pressed={user.is_enabled}
                                                onPressedChange={() => handleToggle(user)}
                                                disabled={toggleUser.isPending}
                                                aria-label={user.is_enabled ? 'Disable user' : 'Enable user'}
                                            >
                                                {user.is_enabled ? 'Enabled' : 'Disabled'}
                                            </Toggle>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(user)} aria-label="Edit user">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingUser(user)} aria-label="Delete user">
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

            <UserSheet open={sheetOpen} onOpenChange={setSheetOpen} user={editingUser} />
            <UserDeleteDialog user={deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)} />
        </AppLayout>
    );
}
