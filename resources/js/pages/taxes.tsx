import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { TaxDeleteDialog } from '@/components/taxes/tax-delete-dialog';
import { TaxSheet } from '@/components/taxes/tax-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useTaxes } from '@/hooks/taxes/useTaxes';
import AppLayout from '@/layouts/app-layout';
import { Tax, TaxFilters, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Taxes', href: '/taxes' }];

const COLUMN_COUNT = 7;

const DEFAULT_FILTERS: TaxFilters = {
    search: '',
    status: 'all',
    company_id: 'all',
    type: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function Taxes() {
    const [filters, setFilters] = useState<TaxFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<Tax | null>(null);
    const [deletingTax, setDeletingTax] = useState<Tax | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useTaxes(filters);
    const { data: companies = [] } = useCompanyOptions();

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
        setEditingTax(null);
        setSheetOpen(true);
    };

    const openEdit = (tax: Tax) => {
        setEditingTax(tax);
        setSheetOpen(true);
    };

    const taxes = data?.data ?? [];
    const isEmpty = !isPending && !isError && taxes.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Taxes" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Taxes</h1>
                        <p className="text-muted-foreground text-sm">Manage the tax rates applied to sales and purchases.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New tax
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search taxes..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filters.company_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, company_id: value, page: 1 }))}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All companies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All companies</SelectItem>
                            {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                    {company.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.type}
                        onValueChange={(value: TaxFilters['type']) => setFilters((prev) => ({ ...prev, type: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status}
                        onValueChange={(value: TaxFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
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
                                <TableHead>Company</TableHead>
                                <SortableHeader label="Rate" column="rate" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Type</TableHead>
                                <TableHead>Inclusive</TableHead>
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
                                            <AlertTitle>Failed to load taxes</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching taxes.
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
                                        No taxes found. Create your first tax to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {taxes.map((tax) => (
                                <TableRow key={tax.id}>
                                    <TableCell className="font-medium">{tax.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{tax.company?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{tax.rate}%</TableCell>
                                    <TableCell className="text-muted-foreground capitalize">{tax.type}</TableCell>
                                    <TableCell className="text-muted-foreground">{tax.is_inclusive ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>
                                        <Badge variant={tax.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                                            {tax.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(tax)} aria-label="Edit tax">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingTax(tax)} aria-label="Delete tax">
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

            <TaxSheet open={sheetOpen} onOpenChange={setSheetOpen} tax={editingTax} />
            <TaxDeleteDialog tax={deletingTax} onOpenChange={(open) => !open && setDeletingTax(null)} />
        </AppLayout>
    );
}
