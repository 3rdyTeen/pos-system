import { ProductUnitDeleteDialog } from '@/components/products/product-unit-delete-dialog';
import { ProductUnitSheet } from '@/components/products/product-unit-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductUnits } from '@/hooks/products/useProductUnits';
import { ProductUnit } from '@/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const COLUMN_COUNT = 4;

export function ProductUnitsSection({ productId, companyId }: { productId: string; companyId: string }) {
    const { data: units = [], isPending } = useProductUnits(productId);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<ProductUnit | null>(null);
    const [deleting, setDeleting] = useState<ProductUnit | null>(null);

    const openCreate = () => {
        setEditing(null);
        setSheetOpen(true);
    };

    const openEdit = (unit: ProductUnit) => {
        setEditing(unit);
        setSheetOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Units</CardTitle>
                <Button size="sm" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add unit
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Unit</TableHead>
                                <TableHead>Conversion factor</TableHead>
                                <TableHead>Base</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!isPending && units.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_COUNT} className="text-muted-foreground py-8 text-center">
                                        No units yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {units.map((unit) => (
                                <TableRow key={unit.id}>
                                    <TableCell className="font-medium">
                                        {unit.unit?.name ?? '—'}
                                        {unit.unit?.abbreviation ? <span className="text-muted-foreground"> ({unit.unit.abbreviation})</span> : null}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{unit.conversion_factor}</TableCell>
                                    <TableCell>{unit.is_base_unit ? <Badge variant="success">Base</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(unit)} aria-label="Edit unit">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleting(unit)} aria-label="Remove unit">
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

            <ProductUnitSheet productId={productId} companyId={companyId} open={sheetOpen} onOpenChange={setSheetOpen} productUnit={editing} />
            <ProductUnitDeleteDialog productId={productId} productUnit={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
        </Card>
    );
}
