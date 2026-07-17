import { ConfirmDeleteDialog } from '@/components/admin/confirm-delete-dialog';
import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { money } from '@/components/pos/cart-summary';
import { SalesReturnSheet } from '@/components/sales/sales-return-sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeleteSalesReturn, useSalesReturns } from '@/hooks/salesReturns/useSalesReturns';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { BreadcrumbItem, SalesReturn, SalesReturnFilters, SalesReturnStatus } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sales', href: '/sales-returns' },
    { title: 'Returns', href: '/sales-returns' },
];

const DEFAULT_FILTERS: SalesReturnFilters = {
    search: '',
    status: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

const STATUS_VARIANT: Record<SalesReturnStatus, 'success' | 'secondary' | 'destructive'> = {
    completed: 'success',
    pending: 'secondary',
    cancelled: 'destructive',
};

const COLUMN_COUNT = 7;

export default function SalesReturns() {
    const [filters, setFilters] = useState<SalesReturnFilters>(DEFAULT_FILTERS);
    const [search, setSearch] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [deleting, setDeleting] = useState<SalesReturn | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useSalesReturns(filters);
    const deleteReturn = useDeleteSalesReturn();

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
            <Head title="Sales returns" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search return or sale number"
                        className="max-w-xs"
                    />

                    <Select
                        value={filters.status}
                        onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, status: value as SalesReturnFilters['status'], page: 1 }))
                        }
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button className="ml-auto" onClick={() => setSheetOpen(true)}>
                        New return
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="Return" column="return_number" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <SortableHeader label="Date" column="return_date" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Sale</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right">Items</TableHead>
                                <SortableHeader label="Refund" column="total_amount" sort={filters.sort} direction={filters.direction} onSort={handleSort} className="text-right" />
                                <TableHead>Status</TableHead>
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
                                                Could not load returns.
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
                                        No returns match these filters.
                                    </TableCell>
                                </TableRow>
                            )}

                            {data?.data.map((salesReturn) => (
                                <TableRow key={salesReturn.id}>
                                    <TableCell className="font-medium">{salesReturn.return_number}</TableCell>
                                    <TableCell>{salesReturn.return_date ?? '—'}</TableCell>
                                    <TableCell>{salesReturn.sale?.sale_number ?? '—'}</TableCell>
                                    <TableCell className="max-w-48 truncate">{salesReturn.reason ?? '—'}</TableCell>
                                    <TableCell className="text-right">{salesReturn.details_count ?? 0}</TableCell>
                                    <TableCell className="text-right font-medium">{money(salesReturn.total_amount)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={STATUS_VARIANT[salesReturn.status]}>{salesReturn.status}</Badge>
                                            {salesReturn.status !== 'completed' && (
                                                <Button size="sm" variant="ghost" onClick={() => setDeleting(salesReturn)}>
                                                    Delete
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

            <SalesReturnSheet open={sheetOpen} onOpenChange={setSheetOpen} />

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.return_number}?`}
                description="Only a return that has not been actioned can be deleted."
                isPending={deleteReturn.isPending}
                onConfirm={() => {
                    if (!deleting) {
                        return;
                    }

                    deleteReturn.mutate(deleting.id, {
                        onSuccess: () => {
                            toast.success(`${deleting.return_number} deleted.`);
                            setDeleting(null);
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
