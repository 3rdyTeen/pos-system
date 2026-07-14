import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { RegisterDeleteDialog } from '@/components/registers/register-delete-dialog';
import { RegisterSheet } from '@/components/registers/register-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBranchOptions } from '@/hooks/branches/useBranches';
import { useRegisters } from '@/hooks/registers/useRegisters';
import AppLayout from '@/layouts/app-layout';
import { Register, RegisterFilters, RegisterStatus, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Registers', href: '/registers' }];

const COLUMN_COUNT = 5;

const DEFAULT_FILTERS: RegisterFilters = {
    search: '',
    status: 'all',
    branch_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

const STATUS_VARIANT: Record<RegisterStatus, 'success' | 'secondary' | 'warning'> = {
    open: 'success',
    closed: 'secondary',
    maintenance: 'warning',
};

export default function Registers() {
    const [filters, setFilters] = useState<RegisterFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingRegister, setEditingRegister] = useState<Register | null>(null);
    const [deletingRegister, setDeletingRegister] = useState<Register | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useRegisters(filters);
    const { data: branches = [] } = useBranchOptions();

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
        setEditingRegister(null);
        setSheetOpen(true);
    };

    const openEdit = (register: Register) => {
        setEditingRegister(register);
        setSheetOpen(true);
    };

    const registers = data?.data ?? [];
    const isEmpty = !isPending && !isError && registers.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Registers" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Registers</h1>
                        <p className="text-muted-foreground text-sm">Manage the point-of-sale registers at your branches.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New register
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search registers..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                    </div>
                    <Select
                        value={filters.branch_id}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, branch_id: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All branches" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All branches</SelectItem>
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status}
                        onValueChange={(value: RegisterFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="Name" column="name" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <SortableHeader label="Code" column="code" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Branch</TableHead>
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
                                            <AlertTitle>Failed to load registers</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching registers.
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
                                        No registers found. Create your first register to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {registers.map((register) => (
                                <TableRow key={register.id}>
                                    <TableCell className="font-medium">{register.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{register.code || '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{register.branch?.name ?? '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[register.status]} className="capitalize">
                                            {register.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(register)} aria-label="Edit register">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingRegister(register)} aria-label="Delete register">
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

            <RegisterSheet open={sheetOpen} onOpenChange={setSheetOpen} register={editingRegister} />
            <RegisterDeleteDialog register={deletingRegister} onOpenChange={(open) => !open && setDeletingRegister(null)} />
        </AppLayout>
    );
}
