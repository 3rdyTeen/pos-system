import { money, round2 } from '@/components/pos/cart-summary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CartComponent, CartModifier, PosConfiguration, PosProduct } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
    product: PosProduct | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: (modifiers: CartModifier[], components: CartComponent[]) => void;
}

/**
 * Asks the cashier what the customer actually wants: which add-ons, which size,
 * and which drink fills a meal's slot.
 *
 * The rules shown here (required, how many may be picked, which slots are fixed)
 * are the ones the server sent, and the server enforces them again on the sale.
 * This dialog exists to make the choice fast, not to be the authority on it.
 */
export function ConfiguratorDialog({ product, onOpenChange, onConfirm }: Props) {
    const productId = product?.id ?? '';

    const { data: config, isPending } = useQuery({
        queryKey: ['pos', 'configuration', productId],
        queryFn: () => api.get<{ data: PosConfiguration }>(`/api/pos/products/${productId}/configuration`),
        select: (response) => response.data,
        enabled: productId !== '',
    });

    // group id -> chosen option ids
    const [picked, setPicked] = useState<Record<string, string[]>>({});
    // slot id -> chosen slot option id
    const [slotPick, setSlotPick] = useState<Record<string, string>>({});

    // Seed the defaults each time the dialog opens for a product, so a meal starts
    // with its house drink already chosen rather than blank.
    useEffect(() => {
        if (!config) {
            return;
        }

        setPicked(
            Object.fromEntries(
                config.groups.map((group) => [group.id, group.options.filter((o) => o.is_default).map((o) => o.id)]),
            ),
        );
        setSlotPick(
            Object.fromEntries(
                config.slots
                    .map((slot) => [slot.id, (slot.options.find((o) => o.is_default) ?? slot.options[0])?.id])
                    .filter(([, id]) => Boolean(id)) as [string, string][],
            ),
        );
    }, [config]);

    const toggle = (groupId: string, optionId: string, single: boolean, max: number | null) => {
        setPicked((prev) => {
            const current = prev[groupId] ?? [];

            if (single) {
                // Tapping the chosen one again clears it, unless the group demands an answer.
                return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] };
            }

            if (current.includes(optionId)) {
                return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
            }

            // Silently refuse rather than let the cashier build something the server
            // will reject a second later.
            if (max !== null && current.length >= max) {
                return prev;
            }

            return { ...prev, [groupId]: [...current, optionId] };
        });
    };

    /** Which required groups still have no answer, so the button can say why. */
    const unmet = useMemo(() => {
        if (!config) {
            return [];
        }

        return config.groups.filter((group) => (picked[group.id]?.length ?? 0) < group.min_select);
    }, [config, picked]);

    const total = useMemo(() => {
        if (!config || !product) {
            return 0;
        }

        let sum = Number(product.unit_price);

        for (const group of config.groups) {
            for (const optionId of picked[group.id] ?? []) {
                sum += Number(group.options.find((o) => o.id === optionId)?.price_delta ?? 0);
            }
        }

        for (const slot of config.slots) {
            sum += Number(slot.options.find((o) => o.id === slotPick[slot.id])?.price_delta ?? 0);
        }

        return round2(sum);
    }, [config, product, picked, slotPick]);

    const confirm = () => {
        if (!config || unmet.length > 0) {
            return;
        }

        const modifiers: CartModifier[] = config.groups.flatMap((group) =>
            (picked[group.id] ?? []).map((optionId) => {
                const option = group.options.find((o) => o.id === optionId)!;

                return {
                    option_id: option.id,
                    group_id: group.id,
                    group_name: group.name,
                    name: option.name,
                    price_delta: option.price_delta,
                };
            }),
        );

        const components: CartComponent[] = config.slots.flatMap((slot) => {
            const option = slot.options.find((o) => o.id === slotPick[slot.id]);

            return option
                ? [{
                      slot_option_id: option.id,
                      slot_id: slot.id,
                      slot_name: slot.name,
                      name: option.name,
                      price_delta: option.price_delta,
                  }]
                : [];
        });

        onConfirm(modifiers, components);
    };

    return (
        <Dialog open={product !== null} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{product?.name}</DialogTitle>
                    <DialogDescription>{product?.is_combo ? 'Choose what goes in the meal.' : 'Choose the options.'}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-5 overflow-y-auto">
                    {isPending &&
                        Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-lg" />)}

                    {/* Combo slots first: what the meal is, before how it is tweaked. */}
                    {config?.slots.map((slot) => (
                        <section key={slot.id} className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium">{slot.name}</h3>
                                {Number(slot.quantity) > 1 && <Badge variant="outline">x{Number(slot.quantity)}</Badge>}
                                {!slot.is_swappable && <Badge variant="secondary">Fixed</Badge>}
                            </div>

                            <div className="grid gap-1.5 sm:grid-cols-2">
                                {slot.options.map((option) => (
                                    <Choice
                                        key={option.id}
                                        label={option.name}
                                        delta={option.price_delta}
                                        selected={slotPick[slot.id] === option.id}
                                        // A fixed slot shows what the customer gets but cannot be changed.
                                        disabled={!slot.is_swappable}
                                        onSelect={() => setSlotPick((prev) => ({ ...prev, [slot.id]: option.id }))}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}

                    {config?.groups.map((group) => {
                        const single = group.selection_type === 'single';
                        const chosen = picked[group.id] ?? [];

                        return (
                            <section key={group.id} className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-medium">{group.name}</h3>
                                    {group.min_select > 0 && <Badge variant="outline">Required</Badge>}
                                    {!single && group.max_select !== null && (
                                        <span className="text-xs text-muted-foreground">
                                            {chosen.length}/{group.max_select}
                                        </span>
                                    )}
                                </div>

                                <div className="grid gap-1.5 sm:grid-cols-2">
                                    {group.options.map((option) => (
                                        <Choice
                                            key={option.id}
                                            label={option.name}
                                            delta={option.price_delta}
                                            selected={chosen.includes(option.id)}
                                            onSelect={() => toggle(group.id, option.id, single, group.max_select)}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <DialogFooter className="mt-2 gap-2 border-t pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">
                        Cancel
                    </Button>
                    <Button type="button" onClick={confirm} disabled={unmet.length > 0 || isPending} className="h-11 flex-1 text-base">
                        {unmet.length > 0 ? `Choose a ${unmet[0].name}` : `Add · ${money(total)}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * One tappable choice. Big enough for a finger, and shows what it costs so the
 * cashier can answer "how much is that?" without adding it first.
 */
function Choice({
    label,
    delta,
    selected,
    disabled,
    onSelect,
}: {
    label: string;
    delta: string;
    selected: boolean;
    disabled?: boolean;
    onSelect: () => void;
}) {
    const value = Number(delta);

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className={cn(
                'flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition',
                selected ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                disabled && 'cursor-not-allowed opacity-60',
            )}
        >
            <span className="flex items-center gap-1.5">
                {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                {label}
            </span>

            {value !== 0 && (
                <span className={cn('text-xs tabular-nums', value < 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-muted-foreground')}>
                    {value > 0 ? '+' : '−'}
                    {money(Math.abs(value))}
                </span>
            )}
        </button>
    );
}
