import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { ProductCategoryDeleteDialog } from '@/components/product-categories/product-category-delete-dialog';
import { ProductCategorySheet } from '@/components/product-categories/product-category-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useProductCategories } from '@/hooks/productCategories/useProductCategories';
import AppLayout from '@/layouts/app-layout';
import { ProductCategory, ProductCategoryFilters, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Categories', href: '/product-categories' }];

const COLUMN_COUNT = 6;

const DEFAULT_FILTERS: ProductCategoryFilters = {
    search: '',
    status: 'all',
    company_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function ProductCategories() {
    const [filters, setFilters] = useState<ProductCategoryFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useProductCategories(filters);
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
        setEditingCategory(null);
        setSheetOpen(true);
    };

    const openEdit = (category: ProductCategory) => {
        setEditingCategory(category);
        setSheetOpen(true);
    };

    const categories = data?.data ?? [];
    const isEmpty = !isPending && !isError && categories.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Categories</h1>
                        <p className="text-muted-foreground text-sm">Organize your products into categories.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New category
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search categories..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
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
                        value={filters.status}
                        onValueChange={(value: ProductCategoryFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
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
                                <TableHead>Parent</TableHead>
                                <TableHead>Slug</TableHead>
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
                                            <AlertTitle>Failed to load categories</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching categories.
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
                                        No categories found. Create your first category to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{category.company?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{category.parent?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{category.slug || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={category.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                                            {category.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(category)} aria-label="Edit category">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingCategory(category)} aria-label="Delete category">
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

            <ProductCategorySheet open={sheetOpen} onOpenChange={setSheetOpen} category={editingCategory} />
            <ProductCategoryDeleteDialog category={deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)} />
        </AppLayout>
    );
}
