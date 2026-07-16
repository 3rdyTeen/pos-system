import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductOptions } from '@/hooks/products/useProductOptions';
import { ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { PurchaseLineDraft } from '@/types';
import { Plus, X } from 'lucide-react';

interface PurchaseLinesEditorProps {
    rows: PurchaseLineDraft[];
    onChange: (rows: PurchaseLineDraft[]) => void;
    /** Server errors keyed by line index, e.g. "details.0.quantity". */
    errors: ValidationErrors;
}

export const emptyPurchaseLine = (): PurchaseLineDraft => ({
    key: uid(),
    product_id: '',
    product_variant_id: null,
    quantity: '1',
    unit_cost: '0',
    tax_amount: '0',
    discount_amount: '0',
});

/**
 * Mirrors PurchaseOrderService::price so the form can preview what an order will be
 * worth. The server recomputes this on submit and its answer is authoritative — this
 * is display only.
 */
export const previewLineTotal = (row: PurchaseLineDraft): number =>
    Number(row.quantity || 0) * Number(row.unit_cost || 0) + Number(row.tax_amount || 0) - Number(row.discount_amount || 0);

export const previewTotals = (rows: PurchaseLineDraft[]) => {
    const subtotal = rows.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.unit_cost || 0), 0);
    const taxTotal = rows.reduce((sum, row) => sum + Number(row.tax_amount || 0), 0);
    const discountTotal = rows.reduce((sum, row) => sum + Number(row.discount_amount || 0), 0);

    return { subtotal, taxTotal, discountTotal, grandTotal: subtotal + taxTotal - discountTotal };
};

export function PurchaseLinesEditor({ rows, onChange, errors }: PurchaseLinesEditorProps) {
    const { data: products = [] } = useProductOptions();

    const updateRow = (key: string, patch: Partial<PurchaseLineDraft>) => {
        onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    };

    // Laravel reports line errors positionally ("details.0.quantity").
    const lineError = (index: number, field: string): string | undefined => errors[`details.${index}.${field}`]?.[0];

    return (
        <div className="grid gap-4">
            {rows.length === 0 && <p className="text-muted-foreground text-sm">No lines yet. Add the products being ordered.</p>}

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
                        <Label htmlFor={`po-line-product-${row.key}`}>Product</Label>
                        <Select
                            value={row.product_id || undefined}
                            // Changing the product invalidates any variant chosen for the old one.
                            onValueChange={(value) => updateRow(row.key, { product_id: value, product_variant_id: null })}
                        >
                            <SelectTrigger id={`po-line-product-${row.key}`}>
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
                        <InputError message={lineError(index, 'product_variant_id')} />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor={`po-line-qty-${row.key}`}>Quantity</Label>
                            <Input
                                id={`po-line-qty-${row.key}`}
                                type="number"
                                step="0.0001"
                                min="0"
                                value={row.quantity}
                                onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                            />
                            <InputError message={lineError(index, 'quantity')} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`po-line-cost-${row.key}`}>Unit cost</Label>
                            <Input
                                id={`po-line-cost-${row.key}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={row.unit_cost}
                                onChange={(e) => updateRow(row.key, { unit_cost: e.target.value })}
                            />
                            <InputError message={lineError(index, 'unit_cost')} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`po-line-tax-${row.key}`}>Tax</Label>
                            <Input
                                id={`po-line-tax-${row.key}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={row.tax_amount}
                                onChange={(e) => updateRow(row.key, { tax_amount: e.target.value })}
                            />
                            <InputError message={lineError(index, 'tax_amount')} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`po-line-discount-${row.key}`}>Discount</Label>
                            <Input
                                id={`po-line-discount-${row.key}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={row.discount_amount}
                                onChange={(e) => updateRow(row.key, { discount_amount: e.target.value })}
                            />
                            <InputError message={lineError(index, 'discount_amount')} />
                        </div>
                    </div>

                    <p className="text-muted-foreground text-sm">Line total: {previewLineTotal(row).toFixed(2)}</p>
                </div>
            ))}

            <Button type="button" variant="outline" onClick={() => onChange([...rows, emptyPurchaseLine()])}>
                <Plus className="h-4 w-4" />
                Add line
            </Button>
        </div>
    );
}
