import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { PurchaseReturnDeleteDialog } from '@/components/purchasing/purchase-return-delete-dialog';
import { PurchaseReturnSheet } from '@/components/purchasing/purchase-return-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePurchaseOrderOptions } from '@/hooks/purchaseOrders/usePurchaseOrders';
import { usePurchaseReturns } from '@/hooks/purchaseReturns/usePurchaseReturns';
import AppLayout from '@/layouts/app-layout';
import { PurchaseReturn, PurchaseReturnFilters, PurchaseReturnStatus, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Returns', href: '/purchase-returns' }];

const COLUMN_COUNT = 7;

const STATUS_VARIANT: Record<PurchaseReturnStatus, 'success' | 'secondary' | 'destructive'> = {
    completed: 'success',
    pending: 'secondary',
    cancelled: 'destructive',
};

const DEFAULT_FILTERS: PurchaseReturnFilters = {
    search: '',
    status: 'all',
    purchase_order_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function PurchaseReturns() {
    const [filters, setFilters] = useState<PurchaseReturnFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<PurchaseReturn | null>(null);
    const [deleting, setDeleting] = useState<PurchaseReturn | null>(null);

    const { data, isPending, isError, isFetching, refetch } = usePurchaseReturns(filters);
    const { data: orders = [] } = usePurchaseOrderOptions();

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

    const openEdit = (purchaseReturn: PurchaseReturn) => {
        setEditing(purchaseReturn);
        setSheetOpen(true);
    };

    const returns = data?.data ?? [];
    const isEmpty = !isPending && !isError && returns.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Returns" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Purchase returns</h1>
                        <p className="text-muted-foreground text-sm">Send goods back to a supplier against an order.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New return
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search returns..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                    </div>
                    <Select
                        value={filters.purchase_order_id}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, purchase_order_id: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All orders" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All orders</SelectItem>
                            {orders.map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                    {order.po_number}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status}
                        onValueChange={(value: PurchaseReturnFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
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
                                    column="return_number"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <TableHead>Purchase order</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Lines</TableHead>
                                <SortableHeader label="Total" column="total_amount" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <SortableHeader label="Status" column="status" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
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
                                            <AlertTitle>Failed to load returns</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching returns.
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
                                        No returns found. Create your first return to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {returns.map((purchaseReturn) => (
                                <TableRow key={purchaseReturn.id}>
                                    <TableCell className="font-medium">{purchaseReturn.return_number}</TableCell>
                                    <TableCell className="text-muted-foreground">{purchaseReturn.purchase_order?.po_number ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{purchaseReturn.purchase_order?.supplier?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{purchaseReturn.details_count ?? 0}</TableCell>
                                    <TableCell>{purchaseReturn.total_amount}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[purchaseReturn.status]} className="capitalize">
                                            {purchaseReturn.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(purchaseReturn)} aria-label="Edit return">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleting(purchaseReturn)} aria-label="Delete return">
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

            <PurchaseReturnSheet open={sheetOpen} onOpenChange={setSheetOpen} purchaseReturn={editing} />
            <PurchaseReturnDeleteDialog purchaseReturn={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
        </AppLayout>
    );
}
