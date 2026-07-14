import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCreateProductVariant, useUpdateProductVariant } from '@/hooks/products/useProductVariants';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { ProductVariant } from '@/types';
import { Plus, X } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface ProductVariantSheetProps {
    productId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    variant: ProductVariant | null;
}

interface AttributeRow {
    key: string;
    value: string;
}

const toRows = (attributes: Record<string, string> | undefined): AttributeRow[] =>
    Object.entries(attributes ?? {}).map(([key, value]) => ({ key, value: String(value) }));

export function ProductVariantSheet({ productId, open, onOpenChange, variant }: ProductVariantSheetProps) {
    const isEdit = variant !== null;
    const createVariant = useCreateProductVariant(productId);
    const updateVariant = useUpdateProductVariant(productId);
    const processing = createVariant.isPending || updateVariant.isPending;

    const [variantName, setVariantName] = useState('');
    const [sku, setSku] = useState('');
    const [attributes, setAttributes] = useState<AttributeRow[]>([]);
    const [costPrice, setCostPrice] = useState('0');
    const [sellingPrice, setSellingPrice] = useState('0');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setVariantName(variant?.variant_name ?? '');
            setSku(variant?.sku ?? '');
            setAttributes(toRows(variant?.attributes));
            setCostPrice(variant?.cost_price ?? '0');
            setSellingPrice(variant?.selling_price ?? '0');
            setErrors({});
        }
    }, [open, variant]);

    const updateAttribute = (index: number, field: keyof AttributeRow, value: string) => {
        setAttributes((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const attributeObject = attributes.reduce<Record<string, string>>((acc, row) => {
            const key = row.key.trim();
            if (key) {
                acc[key] = row.value;
            }
            return acc;
        }, {});

        const payload = {
            variant_name: variantName,
            sku,
            attributes: attributeObject,
            cost_price: costPrice,
            selling_price: sellingPrice,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Variant updated.' : 'Variant created.');
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
            updateVariant.mutate({ id: variant.id, ...payload }, { onSuccess, onError });
        } else {
            createVariant.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit variant' : 'New variant'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the variant details below.' : 'Add a sellable variant of this product.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="variant-name">Variant name</Label>
                        <Input id="variant-name" value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="e.g. Red / Large" autoFocus />
                        <InputError message={errors.variant_name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="variant-sku">SKU</Label>
                        <Input id="variant-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. SHIRT-RD-L" />
                        <InputError message={errors.sku?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Attributes</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => setAttributes((prev) => [...prev, { key: '', value: '' }])}>
                                <Plus className="h-4 w-4" />
                                Add
                            </Button>
                        </div>
                        {attributes.length === 0 && <p className="text-muted-foreground text-sm">No attributes. Add color, size, etc.</p>}
                        {attributes.map((row, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input placeholder="Key" value={row.key} onChange={(e) => updateAttribute(index, 'key', e.target.value)} />
                                <Input placeholder="Value" value={row.value} onChange={(e) => updateAttribute(index, 'value', e.target.value)} />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setAttributes((prev) => prev.filter((_, i) => i !== index))}
                                    aria-label="Remove attribute"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="variant-cost">Cost price</Label>
                            <Input id="variant-cost" type="number" step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
                            <InputError message={errors.cost_price?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="variant-selling">Selling price</Label>
                            <Input
                                id="variant-selling"
                                type="number"
                                step="0.01"
                                min="0"
                                value={sellingPrice}
                                onChange={(e) => setSellingPrice(e.target.value)}
                            />
                            <InputError message={errors.selling_price?.[0]} />
                        </div>
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create variant'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
