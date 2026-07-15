import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { StockTransferDeleteDialog } from '@/components/stock-transfers/stock-transfer-delete-dialog';
import { StockTransferSheet } from '@/components/stock-transfers/stock-transfer-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStockTransfers } from '@/hooks/stockTransfers/useStockTransfers';
import { useWarehouseOptions } from '@/hooks/warehouses/useWarehouses';
import AppLayout from '@/layouts/app-layout';
import { StockTransfer, StockTransferFilters, StockTransferStatus, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Transfers', href: '/stock-transfers' }];

const COLUMN_COUNT = 7;

const STATUS_VARIANT: Record<StockTransferStatus, 'success' | 'secondary' | 'destructive'> = {
    completed: 'success',
    in_transit: 'secondary',
    draft: 'secondary',
    cancelled: 'destructive',
};

const DEFAULT_FILTERS: StockTransferFilters = {
    search: '',
    status: 'all',
    warehouse_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function StockTransfers() {
    const [filters, setFilters] = useState<StockTransferFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<StockTransfer | null>(null);
    const [deleting, setDeleting] = useState<StockTransfer | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useStockTransfers(filters);
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

    const openEdit = (transfer: StockTransfer) => {
        setEditing(transfer);
        setSheetOpen(true);
    };

    const transfers = data?.data ?? [];
    const isEmpty = !isPending && !isError && transfers.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transfers" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Stock transfers</h1>
                        <p className="text-muted-foreground text-sm">Move stock between warehouses.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New transfer
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search transfers..."
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
                        onValueChange={(value: StockTransferFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="in_transit">In transit</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
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
                                    column="transfer_number"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <TableHead>From</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead>Lines</TableHead>
                                <SortableHeader
                                    label="Date"
                                    column="transfer_date"
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
                                            <AlertTitle>Failed to load transfers</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching transfers.
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
                                        No transfers found. Create your first transfer to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {transfers.map((transfer) => (
                                <TableRow key={transfer.id}>
                                    <TableCell className="font-medium">{transfer.transfer_number}</TableCell>
                                    <TableCell className="text-muted-foreground">{transfer.from_warehouse?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{transfer.to_warehouse?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{transfer.details_count ?? 0}</TableCell>
                                    <TableCell className="text-muted-foreground">{transfer.transfer_date ?? '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[transfer.status]} className="capitalize">
                                            {transfer.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(transfer)} aria-label="Edit transfer">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleting(transfer)} aria-label="Delete transfer">
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

            <StockTransferSheet open={sheetOpen} onOpenChange={setSheetOpen} transfer={editing} />
            <StockTransferDeleteDialog transfer={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
        </AppLayout>
    );
}
