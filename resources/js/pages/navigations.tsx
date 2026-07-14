import { ConfirmDeleteDialog } from '@/components/admin/confirm-delete-dialog';
import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { NavigationChangedDialog } from '@/components/navigations/navigation-changed-dialog';
import { NavigationSheet } from '@/components/navigations/navigation-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEnabledModules } from '@/hooks/modules/useModules';
import { useDeleteNavigation } from '@/hooks/navigations/useNavigationMutations';
import { useNavigations } from '@/hooks/navigations/useNavigations';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { Navigation, NavigationFilters } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, CornerDownRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const COLUMN_COUNT = 6;

const DEFAULT_FILTERS: NavigationFilters = {
    search: '',
    module_id: 'all',
    sort: 'order',
    direction: 'asc',
    page: 1,
};

export default function Navigations() {
    const [filters, setFilters] = useState<NavigationFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<Navigation | null>(null);
    const [deleting, setDeleting] = useState<Navigation | null>(null);
    const [changedOpen, setChangedOpen] = useState(false);

    const { data, isPending, isError, isFetching, refetch } = useNavigations(filters);
    const { data: modules = [] } = useEnabledModules();
    const deleteNavigation = useDeleteNavigation();

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

    const confirmDelete = () => {
        if (!deleting) return;
        deleteNavigation.mutate(deleting.id, {
            onSuccess: () => {
                toast.success('Navigation deleted.');
                setDeleting(null);
                setChangedOpen(true);
            },
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Failed to delete navigation.'),
        });
    };

    const openCreate = () => {
        setEditing(null);
        setSheetOpen(true);
    };
    const openEdit = (navigation: Navigation) => {
        setEditing(navigation);
        setSheetOpen(true);
    };

    const navigations = data?.data ?? [];
    const isEmpty = !isPending && !isError && navigations.length === 0;

    return (
        <AppLayout>
            <Head title="Navigations" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Navigations</h1>
                        <p className="text-muted-foreground text-sm">Define the sidebar and menu structure. Stored entirely in the database.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New navigation
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search navigations..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filters.module_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, module_id: value, page: 1 }))}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Module" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All modules</SelectItem>
                            {modules.map((module) => (
                                <SelectItem key={module.id} value={module.id}>
                                    {module.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="Name" column="name" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Module</TableHead>
                                <SortableHeader label="Code" column="code" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>URL</TableHead>
                                <SortableHeader label="Order" column="order" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isPending &&
                                Array.from({ length: 6 }).map((_, i) => (
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
                                            <AlertTitle>Failed to load navigations</AlertTitle>
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
                                        No navigations found. Create your first navigation item.
                                    </TableCell>
                                </TableRow>
                            )}

                            {navigations.map((navigation) => (
                                <TableRow key={navigation.id}>
                                    <TableCell className="font-medium">
                                        <div className={cn('flex items-center gap-2', navigation.parent_id && 'pl-6')}>
                                            {navigation.parent_id && <CornerDownRight className="text-muted-foreground h-3.5 w-3.5" />}
                                            <Icon name={navigation.icon} className="text-muted-foreground h-4 w-4" />
                                            <span>{navigation.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{navigation.module?.name ?? '—'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{navigation.code}</code>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{navigation.url}</TableCell>
                                    <TableCell className="tabular-nums">{navigation.order}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(navigation)} aria-label="Edit navigation">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleting(navigation)}
                                                aria-label="Delete navigation"
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

            <NavigationSheet open={sheetOpen} onOpenChange={setSheetOpen} navigation={editing} onChanged={() => setChangedOpen(true)} />
            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete navigation"
                description={
                    <>
                        Are you sure you want to delete <span className="text-foreground font-medium">{deleting?.name}</span>? Any child items will be
                        moved to the top level.
                    </>
                }
                confirmLabel="Delete navigation"
                onConfirm={confirmDelete}
                isPending={deleteNavigation.isPending}
            />
            <NavigationChangedDialog open={changedOpen} onOpenChange={setChangedOpen} />
        </AppLayout>
    );
}
