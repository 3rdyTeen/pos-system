import { ConfirmDeleteDialog } from '@/components/admin/confirm-delete-dialog';
import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { PosProfileSheet } from '@/components/pos/pos-profile-sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeletePosProfile, usePosProfiles } from '@/hooks/posProfiles/usePosProfiles';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { BreadcrumbItem, PickingMode, PosProfile, PosProfileFilters } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sales', href: '/pos-profiles' },
    { title: 'Terminal profiles', href: '/pos-profiles' },
];

const DEFAULT_FILTERS: PosProfileFilters = {
    search: '',
    status: 'all',
    sort: 'name',
    direction: 'asc',
    page: 1,
};

const PICKING_LABEL: Record<PickingMode, string> = {
    barcode: 'Barcode',
    tiles: 'Tiles',
    hybrid: 'Both',
};

const COLUMN_COUNT = 7;

export default function PosProfiles() {
    const [filters, setFilters] = useState<PosProfileFilters>(DEFAULT_FILTERS);
    const [search, setSearch] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<PosProfile | null>(null);
    const [deleting, setDeleting] = useState<PosProfile | null>(null);

    const { data, isPending, isError, isFetching, refetch } = usePosProfiles(filters);
    const deleteProfile = useDeletePosProfile();

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

    const openEdit = (profile: PosProfile) => {
        setEditing(profile);
        setSheetOpen(true);
    };

    const isEmpty = !isPending && !isError && (data?.data.length ?? 0) === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Terminal profiles" />

            <div className="flex flex-col gap-4 p-4">
                <Alert>
                    <AlertDescription>
                        A profile is what makes one terminal serve a grocery lane, a fast-food counter or a retail desk. Registers
                        without a profile fall back to the company default, and failing that to permissive built-in defaults.
                    </AlertDescription>
                </Alert>

                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search profiles"
                        className="max-w-xs"
                    />

                    <Select
                        value={filters.status}
                        onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, status: value as PosProfileFilters['status'], page: 1 }))
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
                        New profile
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader label="Name" column="name" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Picking</TableHead>
                                <TableHead>Order types</TableHead>
                                <TableHead className="text-right">Registers</TableHead>
                                <TableHead>Rules</TableHead>
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
                                                Could not load profiles.
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
                                        No profiles yet. Terminals are running on the built-in defaults.
                                    </TableCell>
                                </TableRow>
                            )}

                            {data?.data.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell className="font-medium">
                                        {profile.name}
                                        {profile.is_default && (
                                            <Badge variant="secondary" className="ml-2">
                                                Default
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{PICKING_LABEL[profile.picking_mode]}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{profile.order_types.join(', ')}</TableCell>
                                    <TableCell className="text-right">{profile.registers_count ?? 0}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {[
                                            profile.allow_held_orders ? 'holds' : null,
                                            profile.allow_negative_stock ? 'oversell' : 'no oversell',
                                            profile.require_customer ? 'customer required' : null,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={profile.status === 'active' ? 'success' : 'secondary'}>{profile.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => openEdit(profile)}>
                                                Edit
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setDeleting(profile)}>
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

            <PosProfileSheet open={sheetOpen} onOpenChange={setSheetOpen} profile={editing} />

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name}?`}
                description={
                    (deleting?.registers_count ?? 0) > 0
                        ? `${deleting?.registers_count} register(s) use this profile and will fall back to the company default.`
                        : 'No registers use this profile.'
                }
                isPending={deleteProfile.isPending}
                onConfirm={() => {
                    if (!deleting) {
                        return;
                    }

                    deleteProfile.mutate(deleting.id, {
                        onSuccess: () => {
                            toast.success(`${deleting.name} deleted.`);
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
