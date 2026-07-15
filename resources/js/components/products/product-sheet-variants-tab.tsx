import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { AttributeRow, VariantDraft } from '@/types';
import { Plus, X } from 'lucide-react';

interface ProductSheetVariantsTabProps {
    rows: VariantDraft[];
    onChange: (rows: VariantDraft[]) => void;
    onRemove: (row: VariantDraft) => void;
    /** Server validation errors for the row that failed, keyed by client key. */
    rowErrors: Record<string, ValidationErrors>;
}

export const emptyVariantDraft = (): VariantDraft => ({
    key: uid(),
    id: null,
    variant_name: '',
    sku: '',
    attributes: [],
    cost_price: '0',
    selling_price: '0',
});

export function ProductSheetVariantsTab({ rows, onChange, onRemove, rowErrors }: ProductSheetVariantsTabProps) {
    const updateRow = (key: string, patch: Partial<VariantDraft>) => {
        onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    };

    const updateAttribute = (key: string, index: number, field: keyof AttributeRow, value: string) => {
        const row = rows.find((candidate) => candidate.key === key);
        if (!row) {
            return;
        }

        updateRow(key, { attributes: row.attributes.map((attribute, i) => (i === index ? { ...attribute, [field]: value } : attribute)) });
    };

    return (
        <div className="grid gap-4">
            {rows.length === 0 && (
                <p className="text-muted-foreground text-sm">
                    No variants. Add one for each sellable version of this product, such as a size or color.
                </p>
            )}

            {rows.map((row, index) => {
                const errors = rowErrors[row.key] ?? {};

                return (
                    <div key={row.key} className="grid gap-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Variant {index + 1}</p>
                            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(row)} aria-label="Remove variant">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`variant-name-${row.key}`}>Variant name</Label>
                                <Input
                                    id={`variant-name-${row.key}`}
                                    value={row.variant_name}
                                    onChange={(e) => updateRow(row.key, { variant_name: e.target.value })}
                                    placeholder="e.g. Red / Large"
                                />
                                <InputError message={errors.variant_name?.[0]} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`variant-sku-${row.key}`}>SKU</Label>
                                <Input
                                    id={`variant-sku-${row.key}`}
                                    value={row.sku}
                                    onChange={(e) => updateRow(row.key, { sku: e.target.value })}
                                    placeholder="e.g. SHIRT-RD-L"
                                />
                                <InputError message={errors.sku?.[0]} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`variant-cost-${row.key}`}>Cost price</Label>
                                <Input
                                    id={`variant-cost-${row.key}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={row.cost_price}
                                    onChange={(e) => updateRow(row.key, { cost_price: e.target.value })}
                                />
                                <InputError message={errors.cost_price?.[0]} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`variant-selling-${row.key}`}>Selling price</Label>
                                <Input
                                    id={`variant-selling-${row.key}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={row.selling_price}
                                    onChange={(e) => updateRow(row.key, { selling_price: e.target.value })}
                                />
                                <InputError message={errors.selling_price?.[0]} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>Attributes</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateRow(row.key, { attributes: [...row.attributes, { key: '', value: '' }] })}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                            {row.attributes.length === 0 && <p className="text-muted-foreground text-sm">No attributes. Add color, size, etc.</p>}
                            {row.attributes.map((attribute, attributeIndex) => (
                                <div key={attributeIndex} className="flex items-center gap-2">
                                    <Input
                                        placeholder="Key"
                                        value={attribute.key}
                                        onChange={(e) => updateAttribute(row.key, attributeIndex, 'key', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Value"
                                        value={attribute.value}
                                        onChange={(e) => updateAttribute(row.key, attributeIndex, 'value', e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => updateRow(row.key, { attributes: row.attributes.filter((_, i) => i !== attributeIndex) })}
                                        aria-label="Remove attribute"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            <Button type="button" variant="outline" onClick={() => onChange([...rows, emptyVariantDraft()])}>
                <Plus className="h-4 w-4" />
                Add variant
            </Button>
        </div>
    );
}
