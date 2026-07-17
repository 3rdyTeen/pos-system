import { ConfirmDeleteDialog } from '@/components/admin/confirm-delete-dialog';
import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { ModifierGroupSheet } from '@/components/catalog/modifier-group-sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFeatureControls } from '@/hooks/featureControls/useFeatureControls';
import { useDeleteModifierGroup, useModifierGroups } from '@/hooks/modifierGroups/useModifierGroups';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { BreadcrumbItem, ModifierGroup, ModifierGroupFilters } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Catalog', href: '/modifier-groups' },
    { title: 'Modifier groups', href: '/modifier-groups' },
];

const DEFAULT_FILTERS: ModifierGroupFilters = {
    search: '',
    status: 'all',
    sort: 'sort_order',
    direction: 'asc',
    page: 1,
};

const COLUMN_COUNT = 6;

export default function ModifierGroups() {
    const [filters, setFilters] = useState<ModifierGroupFilters>(DEFAULT_FILTERS);
    const [search, setSearch] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<ModifierGroup | null>(null);
    const [deleting, setDeleting] = useState<ModifierGroup | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useModifierGroups(filters);
    const { data: controls } = useFeatureControls();
    const deleteGroup = useDeleteModifierGroup();

    const modifiersOff = controls?.flags.find((flag) => flag.key === 'modifiers.enabled')?.value === false;

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

    const openNew = () => {
        setEditing(null);
        setSheetOpen(true);
    };

    const isEmpty = !isPending && !isError && (data?.data.length ?? 0) === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modifier groups" />

            <div className="flex flex-col gap-4 p-4">
                {/* Building groups while the capability is off would be busywork the
                    terminal then ignores, so say so rather than let it happen quietly. */}
                {modifiersOff && (
                    <Alert>
                        <AlertDescription>
                            Product modifiers are switched off, so the terminal will not offer these. Turn them on under{' '}
                            <Link href="/feature-controls" className="font-medium underline">
                                Feature controls
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search groups"
                        className="max-w-xs"
                    />

                    <Select
                        value={filters.status}
                        onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, status: value as ModifierGroupFilters['status'], page: 1 }))
                        }
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button className="ml-auto" onClick={openNew}>
                        New group
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="Name" column="name" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Choice</TableHead>
                                <TableHead>Options</TableHead>
                                <TableHead className="text-right">Products</TableHead>
                                <SortableHeader label="Status" column="status" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
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
                                                Could not load modifier groups.
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
                                        No groups yet. Build one to offer sizes or add-ons at the till.
                                    </TableCell>
                                </TableRow>
                            )}

                            {data?.data.map((group) => (
                                <TableRow key={group.id}>
                                    <TableCell className="font-medium">
                                        {group.name}
                                        {group.is_required && (
                                            <Badge variant="outline" className="ml-2 font-normal">
                                                Required
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {group.selection_type === 'single'
                                            ? 'One'
                                            : `Any${group.max_select ? ` up to ${group.max_select}` : ''}`}
                                    </TableCell>
                                    <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                                        {(group.options ?? []).map((option) => option.name).join(', ') || '—'}
                                    </TableCell>
                                    <TableCell className="text-right">{group.products_count ?? 0}</TableCell>
                                    <TableCell>
                                        <Badge variant={group.status === 'active' ? 'success' : 'secondary'}>{group.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditing(group);
                                                    setSheetOpen(true);
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setDeleting(group)}>
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {data && <TablePagination meta={data.meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} isFetching={isFetching} />}
            </div>

            <ModifierGroupSheet open={sheetOpen} onOpenChange={setSheetOpen} group={editing} />

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name}?`}
                description={
                    (deleting?.products_count ?? 0) > 0
                        ? `${deleting?.products_count} product(s) offer this group and will stop doing so. Sales already rung up keep what they charged.`
                        : 'Sales already rung up keep what they charged.'
                }
                isPending={deleteGroup.isPending}
                onConfirm={() => {
                    if (!deleting) {
                        return;
                    }

                    deleteGroup.mutate(deleting.id, {
                        onSuccess: () => {
                            toast.success(`${deleting.name} deleted.`);
                            setDeleting(null);
                        },
                        onError: (error: Error) => {
                            const message =
                                error instanceof ApiError ? (Object.values(error.errors)[0]?.[0] ?? error.message) : error.message;
                            toast.error(message);
                        },
                    });
                }}
            />
        </AppLayout>
    );
}
