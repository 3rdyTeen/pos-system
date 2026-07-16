import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { PurchaseOrderDeleteDialog } from '@/components/purchasing/purchase-order-delete-dialog';
import { PurchaseOrderPaymentsSheet } from '@/components/purchasing/purchase-order-payments-sheet';
import { PurchaseOrderReceiveSheet } from '@/components/purchasing/purchase-order-receive-sheet';
import { PurchaseOrderSheet } from '@/components/purchasing/purchase-order-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePurchaseOrders } from '@/hooks/purchaseOrders/usePurchaseOrders';
import { useSupplierOptions } from '@/hooks/suppliers/useSuppliers';
import AppLayout from '@/layouts/app-layout';
import { PurchaseOrder, PurchaseOrderFilters, PurchaseOrderStatus, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, CreditCard, PackageCheck, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Purchase orders', href: '/purchase-orders' }];

const COLUMN_COUNT = 8;

const STATUS_VARIANT: Record<PurchaseOrderStatus, 'success' | 'secondary' | 'destructive'> = {
    received: 'success',
    partially_received: 'secondary',
    ordered: 'secondary',
    draft: 'secondary',
    cancelled: 'destructive',
};

const DEFAULT_FILTERS: PurchaseOrderFilters = {
    search: '',
    status: 'all',
    supplier_id: 'all',
    warehouse_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function PurchaseOrders() {
    const [filters, setFilters] = useState<PurchaseOrderFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<PurchaseOrder | null>(null);
    const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);
    const [paying, setPaying] = useState<PurchaseOrder | null>(null);
    const [deleting, setDeleting] = useState<PurchaseOrder | null>(null);

    const { data, isPending, isError, isFetching, refetch } = usePurchaseOrders(filters);
    const { data: suppliers = [] } = useSupplierOptions();

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

    const openEdit = (order: PurchaseOrder) => {
        setEditing(order);
        setSheetOpen(true);
    };

    const orders = data?.data ?? [];
    const isEmpty = !isPending && !isError && orders.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase orders" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Purchase orders</h1>
                        <p className="text-muted-foreground text-sm">Order stock from your suppliers.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New order
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search orders..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filters.supplier_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, supplier_id: value, page: 1 }))}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All suppliers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All suppliers</SelectItem>
                            {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status}
                        onValueChange={(value: PurchaseOrderFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="ordered">Ordered</SelectItem>
                            <SelectItem value="partially_received">Partially received</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="PO number" column="po_number" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Supplier</TableHead>
                                <TableHead>Warehouse</TableHead>
                                <TableHead>Lines</TableHead>
                                <SortableHeader label="Total" column="grand_total" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Balance</TableHead>
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
                                            <AlertTitle>Failed to load purchase orders</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching purchase orders.
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
                                        No purchase orders found. Create your first order to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.po_number}</TableCell>
                                    <TableCell className="text-muted-foreground">{order.supplier?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{order.warehouse?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{order.details_count ?? 0}</TableCell>
                                    <TableCell>{order.grand_total}</TableCell>
                                    <TableCell className="text-muted-foreground">{order.balance ?? order.grand_total}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[order.status]} className="capitalize">
                                            {order.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => setReceiving(order)} aria-label="Receive order">
                                                <PackageCheck className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setPaying(order)} aria-label="Payments">
                                                <CreditCard className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(order)} aria-label="Edit order">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleting(order)} aria-label="Delete order">
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

            <PurchaseOrderSheet open={sheetOpen} onOpenChange={setSheetOpen} order={editing} />
            <PurchaseOrderReceiveSheet open={receiving !== null} onOpenChange={(open) => !open && setReceiving(null)} order={receiving} />
            <PurchaseOrderPaymentsSheet open={paying !== null} onOpenChange={(open) => !open && setPaying(null)} order={paying} />
            <PurchaseOrderDeleteDialog order={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
        </AppLayout>
    );
}
