import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCreateProductUnit, useUpdateProductUnit } from '@/hooks/products/useProductUnits';
import { useUnitOptions } from '@/hooks/units/useUnits';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { ProductUnit } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface ProductUnitSheetProps {
    productId: string;
    companyId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productUnit: ProductUnit | null;
}

export function ProductUnitSheet({ productId, companyId, open, onOpenChange, productUnit }: ProductUnitSheetProps) {
    const isEdit = productUnit !== null;
    const { data: units = [] } = useUnitOptions(companyId || undefined);
    const createProductUnit = useCreateProductUnit(productId);
    const updateProductUnit = useUpdateProductUnit(productId);
    const processing = createProductUnit.isPending || updateProductUnit.isPending;

    const [unitId, setUnitId] = useState('');
    const [conversionFactor, setConversionFactor] = useState('1');
    const [isBaseUnit, setIsBaseUnit] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setUnitId(productUnit?.unit_id ?? '');
            setConversionFactor(productUnit?.conversion_factor ?? '1');
            setIsBaseUnit(productUnit?.is_base_unit ?? false);
            setErrors({});
        }
    }, [open, productUnit]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            unit_id: unitId,
            conversion_factor: conversionFactor,
            is_base_unit: isBaseUnit,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Unit updated.' : 'Unit added.');
            onOpenChange(false);
        };

        const onError = (error: Error) => {
            if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
                setErrors(error.errors);
            } else {
                toast.error(error.message || 'Something went wrong.');
            }
        };

        if (isEdit) {
            updateProductUnit.mutate({ id: productUnit.id, ...payload }, { onSuccess, onError });
        } else {
            createProductUnit.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit unit' : 'Add unit'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update this product unit below.' : 'Configure a unit of measure for this product.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="product-unit-unit">Unit</Label>
                        <Select value={unitId || undefined} onValueChange={setUnitId}>
                            <SelectTrigger id="product-unit-unit">
                                <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                            <SelectContent>
                                {units.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.name} ({option.abbreviation})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.unit_id?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="product-unit-conversion">Conversion factor</Label>
                        <Input
                            id="product-unit-conversion"
                            type="number"
                            step="0.0001"
                            min="0"
                            value={conversionFactor}
                            onChange={(e) => setConversionFactor(e.target.value)}
                        />
                        <InputError message={errors.conversion_factor?.[0]} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="product-unit-base">Base unit</Label>
                            <p className="text-muted-foreground text-sm">The reference unit for this product.</p>
                        </div>
                        <Switch id="product-unit-base" checked={isBaseUnit} onCheckedChange={setIsBaseUnit} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Add unit'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
