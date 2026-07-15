import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductOptions } from '@/hooks/products/useProductOptions';
import { ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { StockLineDraft } from '@/types';
import { Plus, X } from 'lucide-react';

interface StockLinesEditorProps {
    /** 'adjustment' shows system/counted quantities; 'transfer' shows a single quantity. */
    variant: 'adjustment' | 'transfer';
    rows: StockLineDraft[];
    onChange: (rows: StockLineDraft[]) => void;
    /** Server errors keyed by line index, e.g. "details.0.quantity". */
    errors: ValidationErrors;
}

export const emptyStockLine = (): StockLineDraft => ({
    key: uid(),
    product_id: '',
    product_variant_id: null,
    system_qty: '0',
    counted_qty: '0',
    quantity: '1',
    unit_cost: '0',
});

export function StockLinesEditor({ variant, rows, onChange, errors }: StockLinesEditorProps) {
    const { data: products = [] } = useProductOptions();

    const updateRow = (key: string, patch: Partial<StockLineDraft>) => {
        onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    };

    // Laravel reports line errors positionally ("details.0.quantity"), so they are
    // matched back to rows by index rather than by client key.
    const lineError = (index: number, field: string): string | undefined => errors[`details.${index}.${field}`]?.[0];

    return (
        <div className="grid gap-4">
            {rows.length === 0 && <p className="text-muted-foreground text-sm">No lines yet. Add the products this document covers.</p>}

            {rows.map((row, index) => (
                <div key={row.key} className="grid gap-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Line {index + 1}</p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onChange(rows.filter((candidate) => candidate.key !== row.key))}
                            aria-label="Remove line"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`line-product-${row.key}`}>Product</Label>
                        <Select
                            value={row.product_id || undefined}
                            // Changing the product invalidates any variant chosen for the old one.
                            onValueChange={(value) => updateRow(row.key, { product_id: value, product_variant_id: null })}
                        >
                            <SelectTrigger id={`line-product-${row.key}`}>
                                <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                        {product.sku ? ` (${product.sku})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={lineError(index, 'product_id')} />
                    </div>

                    {variant === 'adjustment' ? (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`line-system-${row.key}`}>System qty</Label>
                                <Input
                                    id={`line-system-${row.key}`}
                                    type="number"
                                    step="0.0001"
                                    value={row.system_qty}
                                    onChange={(e) => updateRow(row.key, { system_qty: e.target.value })}
                                />
                                <InputError message={lineError(index, 'system_qty')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`line-counted-${row.key}`}>Counted qty</Label>
                                <Input
                                    id={`line-counted-${row.key}`}
                                    type="number"
                                    step="0.0001"
                                    value={row.counted_qty}
                                    onChange={(e) => updateRow(row.key, { counted_qty: e.target.value })}
                                />
                                <InputError message={lineError(index, 'counted_qty')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`line-cost-${row.key}`}>Unit cost</Label>
                                <Input
                                    id={`line-cost-${row.key}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={row.unit_cost}
                                    onChange={(e) => updateRow(row.key, { unit_cost: e.target.value })}
                                />
                                <InputError message={lineError(index, 'unit_cost')} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`line-qty-${row.key}`}>Quantity</Label>
                                <Input
                                    id={`line-qty-${row.key}`}
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={row.quantity}
                                    onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                                />
                                <InputError message={lineError(index, 'quantity')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`line-cost-${row.key}`}>Unit cost</Label>
                                <Input
                                    id={`line-cost-${row.key}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={row.unit_cost}
                                    onChange={(e) => updateRow(row.key, { unit_cost: e.target.value })}
                                />
                                <InputError message={lineError(index, 'unit_cost')} />
                            </div>
                        </div>
                    )}

                    {/* The backend also rejects a variant that belongs to another product. */}
                    <InputError message={lineError(index, 'product_variant_id')} />

                    {variant === 'adjustment' && (
                        <p className="text-muted-foreground text-sm">
                            Difference: {(Number(row.counted_qty || 0) - Number(row.system_qty || 0)).toFixed(4)}
                        </p>
                    )}
                </div>
            ))}

            <Button type="button" variant="outline" onClick={() => onChange([...rows, emptyStockLine()])}>
                <Plus className="h-4 w-4" />
                Add line
            </Button>
        </div>
    );
}
