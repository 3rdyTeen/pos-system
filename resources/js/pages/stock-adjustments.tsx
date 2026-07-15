import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { StockAdjustmentDeleteDialog } from '@/components/stock-adjustments/stock-adjustment-delete-dialog';
import { StockAdjustmentSheet } from '@/components/stock-adjustments/stock-adjustment-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStockAdjustments } from '@/hooks/stockAdjustments/useStockAdjustments';
import { useWarehouseOptions } from '@/hooks/warehouses/useWarehouses';
import AppLayout from '@/layouts/app-layout';
import { StockAdjustment, StockAdjustmentFilters, StockAdjustmentStatus, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Adjustments', href: '/stock-adjustments' }];

const COLUMN_COUNT = 7;

const STATUS_VARIANT: Record<StockAdjustmentStatus, 'success' | 'secondary' | 'destructive'> = {
    approved: 'success',
    draft: 'secondary',
    cancelled: 'destructive',
};

const DEFAULT_FILTERS: StockAdjustmentFilters = {
    search: '',
    status: 'all',
    warehouse_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function StockAdjustments() {
    const [filters, setFilters] = useState<StockAdjustmentFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<StockAdjustment | null>(null);
    const [deleting, setDeleting] = useState<StockAdjustment | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useStockAdjustments(filters);
    const { data: warehouses = [] } = useWarehouseOptions();

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
        setEditing(null);
        setSheetOpen(true);
    };

    const openEdit = (adjustment: StockAdjustment) => {
        setEditing(adjustment);
        setSheetOpen(true);
    };

    const adjustments = data?.data ?? [];
    const isEmpty = !isPending && !isError && adjustments.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Adjustments" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Stock adjustments</h1>
                        <p className="text-muted-foreground text-sm">Record physical counts against system quantities.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New adjustment
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search adjustments..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filters.warehouse_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, warehouse_id: value, page: 1 }))}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All warehouses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All warehouses</SelectItem>
                            {warehouses.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status}
                        onValueChange={(value: StockAdjustmentFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader
                                    label="Number"
                                    column="adjustment_number"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <TableHead>Warehouse</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Lines</TableHead>
                                <SortableHeader
                                    label="Date"
                                    column="adjustment_date"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
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
                                            <AlertTitle>Failed to load adjustments</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching adjustments.
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
                                        No adjustments found. Create your first adjustment to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {adjustments.map((adjustment) => (
                                <TableRow key={adjustment.id}>
                                    <TableCell className="font-medium">{adjustment.adjustment_number}</TableCell>
                                    <TableCell className="text-muted-foreground">{adjustment.warehouse?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{adjustment.reason || '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{adjustment.details_count ?? 0}</TableCell>
                                    <TableCell className="text-muted-foreground">{adjustment.adjustment_date ?? '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[adjustment.status]} className="capitalize">
                                            {adjustment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(adjustment)} aria-label="Edit adjustment">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleting(adjustment)}
                                                aria-label="Delete adjustment"
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

            <StockAdjustmentSheet open={sheetOpen} onOpenChange={setSheetOpen} adjustment={editing} />
            <StockAdjustmentDeleteDialog adjustment={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
        </AppLayout>
    );
}
