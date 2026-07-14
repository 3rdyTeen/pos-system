import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCreateProductBarcode, useUpdateProductBarcode } from '@/hooks/products/useProductBarcodes';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { ProductBarcode, ProductUnit, ProductVariant } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface ProductBarcodeSheetProps {
    productId: string;
    variants: ProductVariant[];
    units: ProductUnit[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    barcode: ProductBarcode | null;
}

const NONE_VALUE = 'none';

export function ProductBarcodeSheet({ productId, variants, units, open, onOpenChange, barcode }: ProductBarcodeSheetProps) {
    const isEdit = barcode !== null;
    const createBarcode = useCreateProductBarcode(productId);
    const updateBarcode = useUpdateProductBarcode(productId);
    const processing = createBarcode.isPending || updateBarcode.isPending;

    const [barcodeValue, setBarcodeValue] = useState('');
    const [variantId, setVariantId] = useState('');
    const [unitId, setUnitId] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setBarcodeValue(barcode?.barcode ?? '');
            setVariantId(barcode?.product_variant_id ?? '');
            setUnitId(barcode?.product_unit_id ?? '');
            setIsPrimary(barcode?.is_primary ?? false);
            setErrors({});
        }
    }, [open, barcode]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            barcode: barcodeValue,
            product_variant_id: variantId || null,
            product_unit_id: unitId || null,
            is_primary: isPrimary,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Barcode updated.' : 'Barcode added.');
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
            updateBarcode.mutate({ id: barcode.id, ...payload }, { onSuccess, onError });
        } else {
            createBarcode.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit barcode' : 'New barcode'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update this barcode below.' : 'Assign a barcode to this product.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="barcode-value">Barcode</Label>
                        <Input id="barcode-value" value={barcodeValue} onChange={(e) => setBarcodeValue(e.target.value)} placeholder="e.g. 4800012345678" autoFocus />
                        <InputError message={errors.barcode?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="barcode-variant">Variant</Label>
                        <Select value={variantId || NONE_VALUE} onValueChange={(value) => setVariantId(value === NONE_VALUE ? '' : value)}>
                            <SelectTrigger id="barcode-variant">
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                {variants.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.variant_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.product_variant_id?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="barcode-unit">Unit</Label>
                        <Select value={unitId || NONE_VALUE} onValueChange={(value) => setUnitId(value === NONE_VALUE ? '' : value)}>
                            <SelectTrigger id="barcode-unit">
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                {units.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.unit?.name ?? 'Unit'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.product_unit_id?.[0]} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="barcode-primary">Primary</Label>
                            <p className="text-muted-foreground text-sm">The main barcode for this product.</p>
                        </div>
                        <Switch id="barcode-primary" checked={isPrimary} onCheckedChange={setIsPrimary} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Add barcode'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
