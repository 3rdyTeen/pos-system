import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUnitOptions } from '@/hooks/units/useUnits';
import { ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { BarcodeDraft, UnitDraft, VariantDraft } from '@/types';
import { Plus, X } from 'lucide-react';

interface ProductSheetBarcodesTabProps {
    companyId: string;
    rows: BarcodeDraft[];
    /** Variant/unit drafts from the sibling tabs. Barcodes point at these by client key. */
    variants: VariantDraft[];
    units: UnitDraft[];
    onChange: (rows: BarcodeDraft[]) => void;
    onRemove: (row: BarcodeDraft) => void;
    rowErrors: Record<string, ValidationErrors>;
}

const NONE_VALUE = 'none';

export const emptyBarcodeDraft = (): BarcodeDraft => ({
    key: uid(),
    id: null,
    barcode: '',
    variant_key: null,
    unit_key: null,
    is_primary: false,
});

export function ProductSheetBarcodesTab({ companyId, rows, variants, units, onChange, onRemove, rowErrors }: ProductSheetBarcodesTabProps) {
    const { data: unitOptions = [] } = useUnitOptions(companyId || undefined);

    const unitLabel = (row: UnitDraft) => unitOptions.find((option) => option.id === row.unit_id)?.name ?? 'Unnamed unit';

    const updateRow = (key: string, patch: Partial<BarcodeDraft>) => {
        onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    };

    // Only one barcode may be primary, for the same reason as the base unit: the
    // backend unsets the others on every write.
    const setPrimary = (key: string, checked: boolean) => {
        onChange(
            rows.map((row) => {
                if (row.key === key) {
                    return { ...row, is_primary: checked };
                }

                return checked ? { ...row, is_primary: false } : row;
            }),
        );
    };

    return (
        <div className="grid gap-4">
            {rows.length === 0 && (
                <p className="text-muted-foreground text-sm">No barcodes. Add the codes that scan to this product at the register.</p>
            )}

            {rows.map((row) => {
                const errors = rowErrors[row.key] ?? {};

                return (
                    <div key={row.key} className="grid gap-4 rounded-lg border p-4">
                        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`barcode-value-${row.key}`}>Barcode</Label>
                                <Input
                                    id={`barcode-value-${row.key}`}
                                    value={row.barcode}
                                    onChange={(e) => updateRow(row.key, { barcode: e.target.value })}
                                    placeholder="e.g. 4800012345678"
                                />
                                <InputError message={errors.barcode?.[0]} />
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-8"
                                onClick={() => onRemove(row)}
                                aria-label="Remove barcode"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`barcode-variant-${row.key}`}>Variant</Label>
                                <Select
                                    value={row.variant_key ?? NONE_VALUE}
                                    onValueChange={(value) => updateRow(row.key, { variant_key: value === NONE_VALUE ? null : value })}
                                >
                                    <SelectTrigger id={`barcode-variant-${row.key}`}>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>None</SelectItem>
                                        {variants.map((variant) => (
                                            <SelectItem key={variant.key} value={variant.key}>
                                                {variant.variant_name || 'Unnamed variant'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.product_variant_id?.[0]} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor={`barcode-unit-${row.key}`}>Unit</Label>
                                <Select
                                    value={row.unit_key ?? NONE_VALUE}
                                    onValueChange={(value) => updateRow(row.key, { unit_key: value === NONE_VALUE ? null : value })}
                                >
                                    <SelectTrigger id={`barcode-unit-${row.key}`}>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>None</SelectItem>
                                        {units.map((unit) => (
                                            <SelectItem key={unit.key} value={unit.key}>
                                                {unitLabel(unit)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.product_unit_id?.[0]} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor={`barcode-primary-${row.key}`}>Primary</Label>
                                <p className="text-muted-foreground text-sm">The main barcode for this product.</p>
                            </div>
                            <Switch
                                id={`barcode-primary-${row.key}`}
                                checked={row.is_primary}
                                onCheckedChange={(checked) => setPrimary(row.key, checked)}
                            />
                        </div>
                    </div>
                );
            })}

            <Button type="button" variant="outline" onClick={() => onChange([...rows, emptyBarcodeDraft()])}>
                <Plus className="h-4 w-4" />
                Add barcode
            </Button>
        </div>
    );
}
