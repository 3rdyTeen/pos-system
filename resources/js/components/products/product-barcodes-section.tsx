import { ProductBarcodeDeleteDialog } from '@/components/products/product-barcode-delete-dialog';
import { ProductBarcodeSheet } from '@/components/products/product-barcode-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductBarcodes } from '@/hooks/products/useProductBarcodes';
import { useProductUnits } from '@/hooks/products/useProductUnits';
import { useProductVariants } from '@/hooks/products/useProductVariants';
import { ProductBarcode } from '@/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const COLUMN_COUNT = 5;

export function ProductBarcodesSection({ productId }: { productId: string }) {
    const { data: barcodes = [], isPending } = useProductBarcodes(productId);
    const { data: variants = [] } = useProductVariants(productId);
    const { data: units = [] } = useProductUnits(productId);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<ProductBarcode | null>(null);
    const [deleting, setDeleting] = useState<ProductBarcode | null>(null);

    const openCreate = () => {
        setEditing(null);
        setSheetOpen(true);
    };

    const openEdit = (barcode: ProductBarcode) => {
        setEditing(barcode);
        setSheetOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Barcodes</CardTitle>
                <Button size="sm" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add barcode
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Variant</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Primary</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!isPending && barcodes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_COUNT} className="text-muted-foreground py-8 text-center">
                                        No barcodes yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {barcodes.map((barcode) => (
                                <TableRow key={barcode.id}>
                                    <TableCell className="font-medium">{barcode.barcode}</TableCell>
                                    <TableCell className="text-muted-foreground">{barcode.variant?.name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{barcode.unit?.name ?? '—'}</TableCell>
                                    <TableCell>{barcode.is_primary ? <Badge variant="success">Primary</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(barcode)} aria-label="Edit barcode">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleting(barcode)} aria-label="Delete barcode">
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

            <ProductBarcodeSheet productId={productId} variants={variants} units={units} open={sheetOpen} onOpenChange={setSheetOpen} barcode={editing} />
            <ProductBarcodeDeleteDialog productId={productId} barcode={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
        </Card>
    );
}
