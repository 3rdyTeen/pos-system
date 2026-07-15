import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUnitOptions } from '@/hooks/units/useUnits';
import { ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { UnitDraft } from '@/types';
import { Plus, X } from 'lucide-react';

interface ProductSheetUnitsTabProps {
    companyId: string;
    rows: UnitDraft[];
    onChange: (rows: UnitDraft[]) => void;
    onRemove: (row: UnitDraft) => void;
    rowErrors: Record<string, ValidationErrors>;
}

export const emptyUnitDraft = (): UnitDraft => ({
    key: uid(),
    id: null,
    unit_id: '',
    conversion_factor: '1',
    is_base_unit: false,
});

export function ProductSheetUnitsTab({ companyId, rows, onChange, onRemove, rowErrors }: ProductSheetUnitsTabProps) {
    const { data: units = [] } = useUnitOptions(companyId || undefined);

    const updateRow = (key: string, patch: Partial<UnitDraft>) => {
        onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    };

    // Only one row may be the base unit. The backend unsets the others on every write,
    // so without this the last row saved would silently win over the one that is checked.
    const setBaseUnit = (key: string, checked: boolean) => {
        onChange(
            rows.map((row) => {
                if (row.key === key) {
                    return { ...row, is_base_unit: checked };
                }

                return checked ? { ...row, is_base_unit: false } : row;
            }),
        );
    };

    // A unit can only be attached to the product once.
    const takenUnitIds = new Set(rows.map((row) => row.unit_id).filter(Boolean));

    return (
        <div className="grid gap-4">
            {rows.length === 0 && (
                <p className="text-muted-foreground text-sm">
                    No units. Add the units this product is bought and sold in, such as piece, box, or case.
                </p>
            )}

            {rows.map((row) => {
                const errors = rowErrors[row.key] ?? {};

                return (
                    <div key={row.key} className="grid gap-4 rounded-lg border p-4">
                        <div className="grid grid-cols-[1fr_1fr_auto] items-start gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`unit-unit-${row.key}`}>Unit</Label>
                                <Select value={row.unit_id || undefined} onValueChange={(value) => updateRow(row.key, { unit_id: value })}>
                                    <SelectTrigger id={`unit-unit-${row.key}`}>
                                        <SelectValue placeholder="Select a unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units.map((option) => (
                                            <SelectItem
                                                key={option.id}
                                                value={option.id}
                                                disabled={option.id !== row.unit_id && takenUnitIds.has(option.id)}
                                            >
                                                {option.name} ({option.abbreviation})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.unit_id?.[0]} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor={`unit-conversion-${row.key}`}>Conversion factor</Label>
                                <Input
                                    id={`unit-conversion-${row.key}`}
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={row.conversion_factor}
                                    onChange={(e) => updateRow(row.key, { conversion_factor: e.target.value })}
                                />
                                <InputError message={errors.conversion_factor?.[0]} />
                            </div>

                            <Button type="button" variant="ghost" size="icon" className="mt-8" onClick={() => onRemove(row)} aria-label="Remove unit">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor={`unit-base-${row.key}`}>Base unit</Label>
                                <p className="text-muted-foreground text-sm">The reference unit for this product.</p>
                            </div>
                            <Switch
                                id={`unit-base-${row.key}`}
                                checked={row.is_base_unit}
                                onCheckedChange={(checked) => setBaseUnit(row.key, checked)}
                            />
                        </div>
                    </div>
                );
            })}

            <Button type="button" variant="outline" onClick={() => onChange([...rows, emptyUnitDraft()])}>
                <Plus className="h-4 w-4" />
                Add unit
            </Button>
        </div>
    );
}
