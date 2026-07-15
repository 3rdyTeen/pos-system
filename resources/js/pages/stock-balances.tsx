import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventoryBalances } from '@/hooks/inventoryBalances/useInventoryBalances';
import { useWarehouseOptions } from '@/hooks/warehouses/useWarehouses';
import AppLayout from '@/layouts/app-layout';
import { InventoryBalanceFilters, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Stock on hand', href: '/stock-balances' }];

const COLUMN_COUNT = 7;

const DEFAULT_FILTERS: InventoryBalanceFilters = {
    search: '',
    warehouse_id: 'all',
    stock: 'all',
    sort: 'updated_at',
    direction: 'desc',
    page: 1,
};

export default function StockBalances() {
    const [filters, setFilters] = useState<InventoryBalanceFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');

    const { data, isPending, isError, isFetching, refetch } = useInventoryBalances(filters);
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

    const balances = data?.data ?? [];
    const isEmpty = !isPending && !isError && balances.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock on hand" />

            <div className="flex flex-col gap-4 p-4">
                <div>
                    <h1 className="text-xl font-semibold">Stock on hand</h1>
                    <p className="text-muted-foreground text-sm">Current stock levels per product and warehouse. Maintained by stock postings.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search products..."
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
                        value={filters.stock}
                        onValueChange={(value: InventoryBalanceFilters['stock']) => setFilters((prev) => ({ ...prev, stock: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All stock</SelectItem>
                            <SelectItem value="in_stock">In stock</SelectItem>
                            <SelectItem value="out_of_stock">Out of stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Variant</TableHead>
                                <TableHead>Warehouse</TableHead>
                                <SortableHeader
                                    label="On hand"
                                    column="quantity_on_hand"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Reserved"
                                    column="quantity_reserved"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Available"
                                    column="quantity_available"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Avg. cost"
                                    column="average_cost"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
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
                                            <AlertTitle>Failed to load stock levels</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching stock levels.
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
                                        No stock levels to show yet.
                                    </TableCell>
                                </TableRow>
                            )}

                            {balances.map((balance) => {
                                const belowReorder = Number(balance.quantity_available) <= Number(balance.product?.reorder_level ?? 0);

                                return (
                                    <TableRow key={balance.id}>
                                        <TableCell className="font-medium">
                                            {balance.product?.name ?? '—'}
                                            {balance.product?.sku && <span className="text-muted-foreground"> ({balance.product.sku})</span>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{balance.variant?.variant_name ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">{balance.warehouse?.name ?? '—'}</TableCell>
                                        <TableCell>{balance.quantity_on_hand}</TableCell>
                                        <TableCell className="text-muted-foreground">{balance.quantity_reserved}</TableCell>
                                        <TableCell>
                                            <Badge variant={belowReorder ? 'destructive' : 'success'}>{balance.quantity_available}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{balance.average_cost}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {data && (
                    <TablePagination meta={data.meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} isFetching={isFetching} />
                )}
            </div>
        </AppLayout>
    );
}
