import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { PaymentMethodDeleteDialog } from '@/components/payment-methods/payment-method-delete-dialog';
import { PaymentMethodSheet } from '@/components/payment-methods/payment-method-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { usePaymentMethods } from '@/hooks/paymentMethods/usePaymentMethods';
import AppLayout from '@/layouts/app-layout';
import { PaymentMethod, PaymentMethodFilters, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Payment Methods', href: '/payment-methods' }];

const COLUMN_COUNT = 5;

const DEFAULT_FILTERS: PaymentMethodFilters = {
    search: '',
    company_id: 'all',
    is_active: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function PaymentMethods() {
    const [filters, setFilters] = useState<PaymentMethodFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
    const [deletingPaymentMethod, setDeletingPaymentMethod] = useState<PaymentMethod | null>(null);

    const { data, isPending, isError, isFetching, refetch } = usePaymentMethods(filters);
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
        setEditingPaymentMethod(null);
        setSheetOpen(true);
    };

    const openEdit = (paymentMethod: PaymentMethod) => {
        setEditingPaymentMethod(paymentMethod);
        setSheetOpen(true);
    };

    const paymentMethods = data?.data ?? [];
    const isEmpty = !isPending && !isError && paymentMethods.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Methods" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Payment Methods</h1>
                        <p className="text-muted-foreground text-sm">Manage the payment methods accepted at checkout.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New payment method
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search payment methods..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
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
                        value={filters.is_active}
                        onValueChange={(value: PaymentMethodFilters['is_active']) => setFilters((prev) => ({ ...prev, is_active: value, page: 1 }))}
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
                                <TableHead>Type</TableHead>
                                <TableHead>Active</TableHead>
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
                                            <AlertTitle>Failed to load payment methods</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching payment methods.
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
                                        No payment methods found. Create your first payment method to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {paymentMethods.map((paymentMethod) => (
                                <TableRow key={paymentMethod.id}>
                                    <TableCell className="font-medium">{paymentMethod.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{paymentMethod.company?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground capitalize">{paymentMethod.type || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={paymentMethod.is_active ? 'success' : 'secondary'}>
                                            {paymentMethod.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(paymentMethod)} aria-label="Edit payment method">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingPaymentMethod(paymentMethod)}
                                                aria-label="Delete payment method"
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

            <PaymentMethodSheet open={sheetOpen} onOpenChange={setSheetOpen} paymentMethod={editingPaymentMethod} />
            <PaymentMethodDeleteDialog paymentMethod={deletingPaymentMethod} onOpenChange={(open) => !open && setDeletingPaymentMethod(null)} />
        </AppLayout>
    );
}
