import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useComboSlots, useSaveComboSlots } from '@/hooks/modifierGroups/useModifierGroups';
import { useProductOptions } from '@/hooks/products/useProductOptions';
import { ApiError, ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { ComboSlotDraft } from '@/types';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    productId: string;
}

function emptySlot(): ComboSlotDraft {
    return {
        key: uid(),
        name: '',
        quantity: '1',
        is_swappable: true,
        options: [{ key: uid(), product_id: '', price_delta: '0', is_default: true }],
    };
}

/**
 * The components of a combo meal: what it is made of, and what may fill each part.
 *
 * Only shown for a product marked as a combo, because a slot on a plain product
 * would never be read.
 */
export function ProductComboSection({ productId }: Props) {
    const [slots, setSlots] = useState<ComboSlotDraft[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const { data, isPending } = useComboSlots(productId);
    const { data: products } = useProductOptions();
    const save = useSaveComboSlots();

    // Hydrate once per load; a background refetch must not wipe edits in progress.
    useEffect(() => {
        if (!data) {
            return;
        }

        setSlots(
            data.map((slot) => ({
                key: uid(),
                name: slot.name,
                quantity: String(Number(slot.quantity)),
                is_swappable: slot.is_swappable,
                options: slot.options.map((option) => ({
                    key: uid(),
                    product_id: option.product_id,
                    price_delta: option.price_delta,
                    is_default: option.is_default,
                })),
            })),
        );
    }, [data]);

    const patchSlot = (key: string, next: Partial<ComboSlotDraft>) =>
        setSlots((prev) => prev.map((slot) => (slot.key === key ? { ...slot, ...next } : slot)));

    const submit = () => {
        setErrors({});

        save.mutate(
            {
                productId,
                slots: slots.map((slot) => ({
                    name: slot.name,
                    quantity: slot.quantity || '1',
                    is_swappable: slot.is_swappable,
                    options: slot.options.map((option) => ({
                        product_id: option.product_id,
                        price_delta: option.price_delta || '0',
                        is_default: option.is_default,
                    })),
                })),
            },
            {
                onSuccess: () => toast.success('Combo components saved.'),
                onError: (error: Error) => {
                    if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
                        setErrors(error.errors);
                        toast.error(Object.values(error.errors)[0][0]);

                        return;
                    }

                    toast.error(error.message || 'Something went wrong.');
                },
            },
        );
    };

    return (
        <Card>
            <CardContent className="grid gap-3 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-medium">Combo components</h2>
                        <p className="text-xs text-muted-foreground">
                            What this meal is made of. Each part resolves to a real product, and those are what stock is deducted from.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSlots((prev) => [...prev, emptySlot()])}>
                            Add part
                        </Button>
                        <Button size="sm" onClick={submit} disabled={save.isPending || slots.length === 0}>
                            {save.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>

                {isPending && <Skeleton className="h-24" />}

                {!isPending && slots.length === 0 && (
                    <Alert>
                        <AlertDescription>
                            This combo has no components yet, so it cannot be sold. Add at least one part.
                        </AlertDescription>
                    </Alert>
                )}

                {slots.map((slot, slotIndex) => (
                    <div key={slot.key} className="grid gap-2 rounded-md border p-3">
                        <div className="flex flex-wrap items-end gap-2">
                            <div className="grid flex-1 gap-1">
                                <Label className="text-xs">Part name</Label>
                                <Input
                                    value={slot.name}
                                    onChange={(event) => patchSlot(slot.key, { name: event.target.value })}
                                    placeholder="Drink"
                                    className="h-9"
                                />
                            </div>

                            <div className="grid w-24 gap-1">
                                <Label className="text-xs">Qty</Label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={slot.quantity}
                                    onChange={(event) => patchSlot(slot.key, { quantity: event.target.value })}
                                    className="h-9 tabular-nums"
                                />
                            </div>

                            <label className="flex h-9 items-center gap-2 text-xs">
                                <Switch
                                    checked={slot.is_swappable}
                                    onCheckedChange={(checked) => patchSlot(slot.key, { is_swappable: checked })}
                                />
                                Swappable
                            </label>

                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setSlots((prev) => prev.filter((s) => s.key !== slot.key))}
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                aria-label={`Remove part ${slotIndex + 1}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <InputError message={errors[`slots.${slotIndex}.name`]?.[0]} />

                        <div className="grid gap-1.5 border-t pt-2">
                            {slot.options.map((option, optionIndex) => (
                                <div key={option.key} className="grid gap-1">
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={option.product_id}
                                            onValueChange={(value) =>
                                                patchSlot(slot.key, {
                                                    options: slot.options.map((o) =>
                                                        o.key === option.key ? { ...o, product_id: value } : o,
                                                    ),
                                                })
                                            }
                                        >
                                            <SelectTrigger className="h-9 flex-1">
                                                <SelectValue placeholder="Choose a product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {/* Combos are excluded: nesting one inside another would
                                                    recurse when the sale is priced, and the server refuses it. */}
                                                {(products ?? [])
                                                    .filter((product) => !product.is_combo)
                                                    .map((product) => (
                                                        <SelectItem key={product.id} value={product.id}>
                                                            {product.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>

                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={option.price_delta}
                                            onChange={(event) =>
                                                patchSlot(slot.key, {
                                                    options: slot.options.map((o) =>
                                                        o.key === option.key ? { ...o, price_delta: event.target.value } : o,
                                                    ),
                                                })
                                            }
                                            className="h-9 w-24 tabular-nums"
                                            aria-label="Swap surcharge"
                                        />

                                        {/* Exactly one default per part: it is what an unanswered slot resolves to. */}
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={option.is_default ? 'default' : 'outline'}
                                            onClick={() =>
                                                patchSlot(slot.key, {
                                                    options: slot.options.map((o) => ({ ...o, is_default: o.key === option.key })),
                                                })
                                            }
                                            className="h-9"
                                        >
                                            Default
                                        </Button>

                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() =>
                                                patchSlot(slot.key, { options: slot.options.filter((o) => o.key !== option.key) })
                                            }
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                            aria-label={`Remove option ${optionIndex + 1}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <InputError message={errors[`slots.${slotIndex}.options.${optionIndex}.product_id`]?.[0]} />
                                </div>
                            ))}

                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                    patchSlot(slot.key, {
                                        options: [
                                            ...slot.options,
                                            { key: uid(), product_id: '', price_delta: '0', is_default: slot.options.length === 0 },
                                        ],
                                    })
                                }
                                className="justify-self-start"
                            >
                                Add choice
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
