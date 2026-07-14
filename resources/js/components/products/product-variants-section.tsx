import { ProductVariantDeleteDialog } from '@/components/products/product-variant-delete-dialog';
import { ProductVariantSheet } from '@/components/products/product-variant-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductVariants } from '@/hooks/products/useProductVariants';
import { ProductVariant } from '@/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const COLUMN_COUNT = 5;

export function ProductVariantsSection({ productId }: { productId: string }) {
    const { data: variants = [], isPending } = useProductVariants(productId);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<ProductVariant | null>(null);
    const [deleting, setDeleting] = useState<ProductVariant | null>(null);

    const openCreate = () => {
        setEditing(null);
        setSheetOpen(true);
    };

    const openEdit = (variant: ProductVariant) => {
        setEditing(variant);
        setSheetOpen(true);
    };

    const formatAttributes = (attributes: Record<string, string>) =>
        Object.entries(attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Variants</CardTitle>
                <Button size="sm" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add variant
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Attributes</TableHead>
                                <TableHead>Selling price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!isPending && variants.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_COUNT} className="text-muted-foreground py-8 text-center">
                                        No variants yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {variants.map((variant) => (
                                <TableRow key={variant.id}>
                                    <TableCell className="font-medium">{variant.variant_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{variant.sku || '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{formatAttributes(variant.attributes) || '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{variant.selling_price}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(variant)} aria-label="Edit variant">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleting(variant)} aria-label="Delete variant">
                                                <Trash2 className="text-destructive h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <ProductVariantSheet productId={productId} open={sheetOpen} onOpenChange={setSheetOpen} variant={editing} />
            <ProductVariantDeleteDialog productId={productId} variant={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
        </Card>
    );
}
