import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { UnitDeleteDialog } from '@/components/units/unit-delete-dialog';
import { UnitSheet } from '@/components/units/unit-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useUnits } from '@/hooks/units/useUnits';
import AppLayout from '@/layouts/app-layout';
import { Unit, UnitFilters, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Units', href: '/units' }];

const COLUMN_COUNT = 6;

const DEFAULT_FILTERS: UnitFilters = {
    search: '',
    company_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function Units() {
    const [filters, setFilters] = useState<UnitFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useUnits(filters);
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
        setEditingUnit(null);
        setSheetOpen(true);
    };

    const openEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setSheetOpen(true);
    };

    const units = data?.data ?? [];
    const isEmpty = !isPending && !isError && units.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Units" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Units</h1>
                        <p className="text-muted-foreground text-sm">Manage the units of measure used for your products.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New unit
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search units..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
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
                </div>

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="Name" column="name" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <SortableHeader
                                    label="Abbreviation"
                                    column="abbreviation"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <TableHead>Company</TableHead>
                                <TableHead>Base unit</TableHead>
                                <TableHead>Conversion</TableHead>
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
                                            <AlertTitle>Failed to load units</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching units.
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
                                        No units found. Create your first unit to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {units.map((unit) => (
                                <TableRow key={unit.id}>
                                    <TableCell className="font-medium">{unit.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{unit.abbreviation}</TableCell>
                                    <TableCell className="text-muted-foreground">{unit.company?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{unit.base_unit?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{unit.conversion_factor}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(unit)} aria-label="Edit unit">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingUnit(unit)} aria-label="Delete unit">
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

            <UnitSheet open={sheetOpen} onOpenChange={setSheetOpen} unit={editingUnit} />
            <UnitDeleteDialog unit={deletingUnit} onOpenChange={(open) => !open && setDeletingUnit(null)} />
        </AppLayout>
    );
}
