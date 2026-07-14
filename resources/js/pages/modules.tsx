import { ConfirmDeleteDialog } from '@/components/admin/confirm-delete-dialog';
import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { ModuleSheet } from '@/components/modules/module-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeleteModule, useToggleModule } from '@/hooks/modules/useModuleMutations';
import { useModules } from '@/hooks/modules/useModules';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Module, ModuleFilters, StatusFilter } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const COLUMN_COUNT = 4;

const DEFAULT_FILTERS: ModuleFilters = {
    search: '',
    status: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function Modules() {
    const [filters, setFilters] = useState<ModuleFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<Module | null>(null);
    const [deleting, setDeleting] = useState<Module | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useModules(filters);
    const toggleModule = useToggleModule();
    const deleteModule = useDeleteModule();

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

    const handleToggle = (module: Module) => {
        toggleModule.mutate(module.id, {
            onSuccess: () => toast.success(module.is_enabled ? 'Module disabled.' : 'Module enabled.'),
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Failed to update module.'),
        });
    };

    const confirmDelete = () => {
        if (!deleting) return;
        deleteModule.mutate(deleting.id, {
            onSuccess: () => {
                toast.success('Module deleted.');
                setDeleting(null);
            },
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Failed to delete module.'),
        });
    };

    const openCreate = () => {
        setEditing(null);
        setSheetOpen(true);
    };
    const openEdit = (module: Module) => {
        setEditing(module);
        setSheetOpen(true);
    };

    const modules = data?.data ?? [];
    const isEmpty = !isPending && !isError && modules.length === 0;

    return (
        <AppLayout>
            <Head title="Modules" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Modules</h1>
                        <p className="text-muted-foreground text-sm">Manage the application modules.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New module
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search modules..."
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
                                            <AlertTitle>Failed to load modules</AlertTitle>
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
                                        No modules found. Create your first module to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {modules.map((module) => (
                                <TableRow key={module.id}>
                                    <TableCell className="font-medium">{module.name}</TableCell>
                                    <TableCell>
                                        <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{module.code}</code>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={module.is_enabled}
                                            onCheckedChange={() => handleToggle(module)}
                                            disabled={toggleModule.isPending}
                                            aria-label={module.is_enabled ? 'Disable module' : 'Enable module'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(module)} aria-label="Edit module">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleting(module)} aria-label="Delete module">
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

            <ModuleSheet open={sheetOpen} onOpenChange={setSheetOpen} module={editing} />
            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete module"
                description={
                    <>
                        Are you sure you want to delete <span className="text-foreground font-medium">{deleting?.name}</span>? Navigations and role
                        grants that reference it will no longer be visible.
                    </>
                }
                confirmLabel="Delete module"
                onConfirm={confirmDelete}
                isPending={deleteModule.isPending}
            />
        </AppLayout>
    );
}
