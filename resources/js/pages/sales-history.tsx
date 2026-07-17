import { money } from '@/components/pos/cart-summary';
import { ConfirmDeleteDialog } from '@/components/admin/confirm-delete-dialog';
import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { SaleDetailSheet } from '@/components/sales/sale-detail-sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSales, useVoidSale } from '@/hooks/sales/useSales';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { BreadcrumbItem, Sale, SaleFilters, SalePaymentStatus, SaleStatus } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sales', href: '/sales-history' },
    { title: 'Sales', href: '/sales-history' },
];

const DEFAULT_FILTERS: SaleFilters = {
    search: '',
    status: 'all',
    payment_status: 'all',
    register_id: 'all',
    from: '',
    to: '',
    sort: 'sale_date',
    direction: 'desc',
    page: 1,
};

const STATUS_VARIANT: Record<SaleStatus, 'success' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'success',
    held: 'secondary',
    draft: 'outline',
    void: 'destructive',
};

const PAYMENT_VARIANT: Record<SalePaymentStatus, 'success' | 'secondary' | 'destructive'> = {
    paid: 'success',
    partial: 'secondary',
    unpaid: 'destructive',
};

const COLUMN_COUNT = 8;

export default function SalesHistory() {
    const [filters, setFilters] = useState<SaleFilters>(DEFAULT_FILTERS);
    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState<Sale | null>(null);
    const [voiding, setVoiding] = useState<Sale | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useSales(filters);
    const voidSale = useVoidSale();

    useEffect(() => {
        const timer = setTimeout(() => setFilters((prev) => ({ ...prev, search, page: 1 })), 300);

        return () => clearTimeout(timer);
    }, [search]);

    const handleSort = (column: string) =>
        setFilters((prev) => ({
            ...prev,
            sort: column,
            direction: prev.sort === column && prev.direction === 'asc' ? 'desc' : 'asc',
            page: 1,
        }));

    const isEmpty = !isPending && !isError && (data?.data.length ?? 0) === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search sale number or customer"
                        className="max-w-xs"
                    />

                    <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as SaleFilters['status'], page: 1 }))}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="held">Held</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="void">Void</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.payment_status}
                        onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, payment_status: value as SaleFilters['payment_status'], page: 1 }))
                        }
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All payments</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input
                        type="date"
                        value={filters.from}
                        onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value, page: 1 }))}
                        className="w-40"
                        aria-label="From date"
                    />
                    <Input
                        type="date"
                        value={filters.to}
                        onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value, page: 1 }))}
                        className="w-40"
                        aria-label="To date"
                    />
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="Sale" column="sale_number" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <SortableHeader label="Date" column="sale_date" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Customer</TableHead>
                                <TableHead>Register</TableHead>
                                <TableHead className="text-right">Items</TableHead>
                                <SortableHeader label="Total" column="grand_total" sort={filters.sort} direction={filters.direction} onSort={handleSort} className="text-right" />
                                <TableHead>Status</TableHead>
                                <TableHead className="w-24" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isPending &&
                                Array.from({ length: 5 }).map((_, row) => (
                                    <TableRow key={row}>
                                        {Array.from({ length: COLUMN_COUNT }).map((_, cell) => (
                                            <TableCell key={cell}>
                                                <Skeleton className="h-5" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}

                            {isError && (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_COUNT}>
                                        <Alert variant="destructive">
                                            <AlertDescription className="flex items-center justify-between gap-4">
                                                Could not load sales.
                                                <Button size="sm" variant="outline" onClick={() => refetch()}>
                                                    Retry
                                                </Button>
                                            </AlertDescription>
                                        </Alert>
                                    </TableCell>
                                </TableRow>
                            )}

                            {isEmpty && (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-sm text-muted-foreground">
                                        No sales match these filters.
                                    </TableCell>
                                </TableRow>
                            )}

                            {data?.data.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium">{sale.sale_number}</TableCell>
                                    <TableCell>{sale.sale_date ? new Date(sale.sale_date).toLocaleString() : '—'}</TableCell>
                                    <TableCell>{sale.customer?.name ?? 'Walk-in'}</TableCell>
                                    <TableCell>{sale.register?.name ?? '—'}</TableCell>
                                    <TableCell className="text-right">{sale.details_count ?? 0}</TableCell>
                                    <TableCell className="text-right font-medium">{money(sale.grand_total)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Badge variant={STATUS_VARIANT[sale.status]}>{sale.status}</Badge>
                                            {sale.status === 'completed' && (
                                                <Badge variant={PAYMENT_VARIANT[sale.payment_status]}>{sale.payment_status}</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => setViewing(sale)}>
                                                View
                                            </Button>
                                            {sale.status === 'completed' && (
                                                <Button size="sm" variant="ghost" onClick={() => setVoiding(sale)}>
                                                    Void
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {data && <TablePagination meta={data.meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} isFetching={isFetching} />}
            </div>

            <SaleDetailSheet sale={viewing} onOpenChange={(open) => !open && setViewing(null)} />

            <ConfirmDeleteDialog
                open={voiding !== null}
                onOpenChange={(open) => !open && setVoiding(null)}
                title={`Void ${voiding?.sale_number}?`}
                description="The sale is kept for the record and its stock goes back on the shelf. This cannot be undone."
                confirmLabel="Void sale"
                isPending={voidSale.isPending}
                onConfirm={() => {
                    if (!voiding) {
                        return;
                    }

                    voidSale.mutate(voiding.id, {
                        onSuccess: () => {
                            toast.success(`${voiding.sale_number} voided.`);
                            setVoiding(null);
                        },
                        onError: (error: Error) => {
                            const message =
                                error instanceof ApiError ? Object.values(error.errors)[0]?.[0] ?? error.message : error.message;
                            toast.error(message);
                        },
                    });
                }}
            />
        </AppLayout>
    );
}
