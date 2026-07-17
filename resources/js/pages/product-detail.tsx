import { ProductBarcodesSection } from '@/components/products/product-barcodes-section';
import { ProductComboSection } from '@/components/products/product-combo-section';
import { ProductModifiersSection } from '@/components/products/product-modifiers-section';
import { ProductUnitsSection } from '@/components/products/product-units-section';
import { ProductVariantsSection } from '@/components/products/product-variants-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Product, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface ProductDetailProps {
    product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Products', href: '/products' },
        { title: product.name, href: `/products/${product.id}` },
    ];

    const summary: { label: string; value: string }[] = [
        { label: 'SKU', value: product.sku || '—' },
        { label: 'Company', value: product.company?.name ?? '—' },
        { label: 'Category', value: product.category?.name ?? '—' },
        { label: 'Base unit', value: product.base_unit?.name ?? '—' },
        { label: 'Tax', value: product.tax?.name ?? '—' },
        { label: 'Cost price', value: product.cost_price },
        { label: 'Selling price', value: product.selling_price },
        { label: 'Reorder level', value: product.reorder_level },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={product.name} />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild aria-label="Back to products">
                            <Link href="/products">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold">{product.name}</h1>
                                <Badge variant={product.is_active ? 'success' : 'secondary'}>{product.is_active ? 'Active' : 'Inactive'}</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">Manage this product's variants, units, and barcodes.</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
                        {summary.map((item) => (
                            <div key={item.label}>
                                <p className="text-muted-foreground text-xs">{item.label}</p>
                                <p className="text-sm font-medium">{item.value}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Only meaningful for a combo: a slot on a plain product would never
                    be read, so showing the editor would just invite confusion. */}
                {product.is_combo && <ProductComboSection productId={product.id} />}

                <ProductModifiersSection productId={product.id} />
                <ProductVariantsSection productId={product.id} />
                <ProductUnitsSection productId={product.id} companyId={product.company_id} />
                <ProductBarcodesSection productId={product.id} />
            </div>
        </AppLayout>
    );
}
