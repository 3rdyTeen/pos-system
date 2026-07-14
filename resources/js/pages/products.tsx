import { SortableHeader } from '@/components/admin/sortable-header';
import { TablePagination } from '@/components/admin/table-pagination';
import { ProductDeleteDialog } from '@/components/products/product-delete-dialog';
import { ProductSheet } from '@/components/products/product-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useProductCategoryOptions } from '@/hooks/productCategories/useProductCategories';
import { useProducts } from '@/hooks/products/useProducts';
import AppLayout from '@/layouts/app-layout';
import { Product, ProductFilters, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, Pencil, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Products', href: '/products' }];

const COLUMN_COUNT = 7;

const DEFAULT_FILTERS: ProductFilters = {
    search: '',
    status: 'all',
    company_id: 'all',
    category_id: 'all',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
};

export default function Products() {
    const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    const { data, isPending, isError, isFetching, refetch } = useProducts(filters);
    const { data: companies = [] } = useCompanyOptions();
    const { data: categories = [] } = useProductCategoryOptions();

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
        setEditingProduct(null);
        setSheetOpen(true);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setSheetOpen(true);
    };

    const products = data?.data ?? [];
    const isEmpty = !isPending && !isError && products.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Products</h1>
                        <p className="text-muted-foreground text-sm">Manage your product catalog.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New product
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input placeholder="Search products..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
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
                    <Select value={filters.category_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, category_id: value, page: 1 }))}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status}
                        onValueChange={(value: ProductFilters['status']) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
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
                                <SortableHeader label="SKU" column="sku" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                <TableHead>Company</TableHead>
                                <TableHead>Category</TableHead>
                                <SortableHeader
                                    label="Selling price"
                                    column="selling_price"
                                    sort={filters.sort}
                                    direction={filters.direction}
                                    onSort={handleSort}
                                />
                                <TableHead>Status</TableHead>
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
                                            <AlertTitle>Failed to load products</AlertTitle>
                                            <AlertDescription className="flex items-center gap-3">
                                                Something went wrong while fetching products.
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
                                        No products found. Create your first product to get started.
                                    </TableCell>
                                </TableRow>
                            )}

                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{product.sku || '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{product.company?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{product.category?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{product.selling_price}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.is_active ? 'success' : 'secondary'}>{product.is_active ? 'Active' : 'Inactive'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild aria-label="Manage product">
                                                <Link href={`/products/${product.id}`}>
                                                    <Settings2 className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(product)} aria-label="Edit product">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingProduct(product)} aria-label="Delete product">
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

            <ProductSheet open={sheetOpen} onOpenChange={setSheetOpen} product={editingProduct} />
            <ProductDeleteDialog product={deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)} />
        </AppLayout>
    );
}
