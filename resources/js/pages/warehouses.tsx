import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WarehouseDeleteDialog } from '@/components/warehouses/warehouse-delete-dialog';
import { WarehouseSheet } from '@/components/warehouses/warehouse-sheet';
import { useBranchOptions } from '@/hooks/branches/useBranches';
import { useWarehouses } from '@/hooks/warehouses/useWarehouses';
import AppLayout from '@/layouts/app-layout';
import { Warehouse, WarehouseFilters, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Warehouses', href: '/warehouses' }];

const COLUMN_COUNT = 6;

const DEFAULT_FILTERS: WarehouseFilters = {
    search: '',
    status: 'all',
    branch_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function Warehouses() {
    const [filters, setFilters] = useState<WarehouseFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useWarehouses(filters);
    const { data: branches = [] } = useBranchOptions();

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

    const openCreate = () => {
        setEditingWarehouse(null);
        setSheetOpen(true);
    };

    const openEdit = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        setSheetOpen(true);
    };

    const warehouses = data?.data ?? [];
    const isEmpty = !isPending && !isError && warehouses.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warehouses" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Warehouses</h1>
                        <p className="text-muted-foreground text-sm">Locations that hold stock, grouped under a branch.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New warehouse
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search warehouses..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filters.branch_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, branch_id: value, page: 1 }))}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All branches" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All branches</SelectItem>
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status}
                        onValueChange={(value: WarehouseFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="Name" column="name" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <SortableHeader label="Code" column="code" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Branch</TableHead>
                                <TableHead>Default</TableHead>
                                <SortableHeader
                                    label="Status"
                                    column="status"
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
                                            <AlertTitle>Failed to load warehouses</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching warehouses.
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
                                        No warehouses found. Create your first warehouse to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {warehouses.map((warehouse) => (
                                <TableRow key={warehouse.id}>
                                    <TableCell className="font-medium">{warehouse.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{warehouse.code || '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{warehouse.branch?.name ?? '—'}</TableCell>
                                    <TableCell>{warehouse.is_default ? <Badge variant="secondary">Default</Badge> : '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={warehouse.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                                            {warehouse.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(warehouse)} aria-label="Edit warehouse">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingWarehouse(warehouse)}
                                                aria-label="Delete warehouse"
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

            <WarehouseSheet open={sheetOpen} onOpenChange={setSheetOpen} warehouse={editingWarehouse} />
            <WarehouseDeleteDialog warehouse={deletingWarehouse} onOpenChange={(open) => !open && setDeletingWarehouse(null)} />
        </AppLayout>
    );
}
