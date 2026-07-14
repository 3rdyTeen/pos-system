import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { CurrencyDeleteDialog } from '@/components/currencies/currency-delete-dialog';
import { CurrencySheet } from '@/components/currencies/currency-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrencies } from '@/hooks/currencies/useCurrencies';
import AppLayout from '@/layouts/app-layout';
import { Currency, CurrencyFilters, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Currencies', href: '/currencies' }];

const COLUMN_COUNT = 7;

const DEFAULT_FILTERS: CurrencyFilters = {
    search: '',
    status: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function Currencies() {
    const [filters, setFilters] = useState<CurrencyFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
    const [deletingCurrency, setDeletingCurrency] = useState<Currency | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useCurrencies(filters);

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
        setEditingCurrency(null);
        setSheetOpen(true);
    };

    const openEdit = (currency: Currency) => {
        setEditingCurrency(currency);
        setSheetOpen(true);
    };

    const currencies = data?.data ?? [];
    const isEmpty = !isPending && !isError && currencies.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Currencies" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Currencies</h1>
                        <p className="text-muted-foreground text-sm">Manage the currencies and exchange rates used across the system.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New currency
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search currencies..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                    </div>
                    <Select
                        value={filters.status}
                        onValueChange={(value: CurrencyFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
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
                                <SortableHeader label="Code" column="code" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <SortableHeader label="Name" column="name" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Symbol</TableHead>
                                <TableHead>Exchange rate</TableHead>
                                <TableHead>Base</TableHead>
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
                                            <AlertTitle>Failed to load currencies</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching currencies.
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
                                        No currencies found. Create your first currency to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {currencies.map((currency) => (
                                <TableRow key={currency.id}>
                                    <TableCell className="font-medium">{currency.code}</TableCell>
                                    <TableCell>{currency.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{currency.symbol || '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{currency.exchange_rate}</TableCell>
                                    <TableCell>{currency.is_base ? <Badge variant="success">Base</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                                    <TableCell>
                                        <Badge variant={currency.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                                            {currency.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(currency)} aria-label="Edit currency">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingCurrency(currency)} aria-label="Delete currency">
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

            <CurrencySheet open={sheetOpen} onOpenChange={setSheetOpen} currency={editingCurrency} />
            <CurrencyDeleteDialog currency={deletingCurrency} onOpenChange={(open) => !open && setDeletingCurrency(null)} />
        </AppLayout>
    );
}
