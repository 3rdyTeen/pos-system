import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CartLine } from '@/types';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { money, round2 } from './cart-summary';

interface Props {
    line: CartLine;
    onPatch: (patch: Partial<CartLine>) => void;
    onRemove: () => void;
    allowNegativeStock: boolean;
    /** Control-page switches: whether the till may show stock, override price, or discount a line. */
    showStock: boolean;
    allowPriceOverride: boolean;
    allowLineDiscount: boolean;
}

/**
 * One line in the cart.
 *
 * Built for a finger, not a mouse: quantity moves on 40px steppers, and the price
 * and discount stay collapsed behind a tap so the common case (scan, adjust
 * quantity, move on) needs no typing at all.
 */
export function CartLineRow({ line, onPatch, onRemove, allowNegativeStock, showStock, allowPriceOverride, allowLineDiscount }: Props) {
    const [expanded, setExpanded] = useState(false);

    // Nothing to reveal if the cashier may neither reprice nor discount a line.
    const canExpand = allowPriceOverride || allowLineDiscount;

    const quantity = Number(line.quantity || 0);
    const discount = Number(line.discount_amount || 0);
    const lineTotal = round2(quantity * Number(line.unit_price || 0) - discount);

    const onHand = !showStock || line.stock_on_hand === null ? null : Number(line.stock_on_hand);
    // Only worth flagging if the till is actually going to refuse the sale, or if the
    // shelf genuinely cannot cover it.
    const oversold = onHand !== null && quantity > onHand;

    const step = (delta: number) => {
        const next = round2(quantity + delta);

        if (next <= 0) {
            onRemove();

            return;
        }

        onPatch({ quantity: String(next) });
    };

    return (
        <div className={cn('rounded-lg border p-3 transition-colors', oversold && !allowNegativeStock && 'border-destructive/50 bg-destructive/5')}>
            <div className="flex items-start gap-2">
                <button
                    type="button"
                    onClick={() => canExpand && setExpanded((prev) => !prev)}
                    className={cn('flex-1 text-left', !canExpand && 'cursor-default')}
                >
                    <p className="text-sm leading-tight font-medium">{line.name}</p>

                    {/* What the customer actually asked for, under the item it belongs to. */}
                    {(line.components.length > 0 || line.modifiers.length > 0) && (
                        <ul className="mt-1 grid gap-0.5">
                            {line.components.map((component) => (
                                <li key={component.slot_option_id} className="text-xs text-muted-foreground">
                                    {component.slot_name}: {component.name}
                                    {Number(component.price_delta) !== 0 && ` (+${money(component.price_delta)})`}
                                </li>
                            ))}
                            {line.modifiers.map((modifier) => (
                                <li key={modifier.option_id} className="text-xs text-muted-foreground">
                                    + {modifier.name}
                                    {Number(modifier.price_delta) !== 0 && ` (${Number(modifier.price_delta) > 0 ? '+' : '−'}${money(Math.abs(Number(modifier.price_delta)))})`}
                                </li>
                            ))}
                        </ul>
                    )}

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {money(line.unit_price)}
                        {discount > 0 && <span className="text-emerald-600 dark:text-emerald-500"> · -{money(discount)}</span>}
                        {line.tax_rate && Number(line.tax_rate) > 0 && (
                            <span>
                                {' '}
                                · {line.tax_inclusive ? 'incl.' : 'plus'} {line.tax_rate}% tax
                            </span>
                        )}
                    </p>
                </button>

                <span className="text-base font-semibold tabular-nums">{money(lineTotal)}</span>

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={onRemove}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${line.name}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="mt-2 flex items-center gap-2">
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => step(-1)}
                    className="h-10 w-10 shrink-0"
                    aria-label={`One fewer ${line.name}`}
                >
                    <Minus className="h-4 w-4" />
                </Button>

                <Input
                    type="number"
                    inputMode="decimal"
                    step="0.001"
                    min="0"
                    value={line.quantity}
                    onChange={(event) => onPatch({ quantity: event.target.value })}
                    onFocus={(event) => event.target.select()}
                    className="h-10 w-20 text-center text-base font-medium tabular-nums"
                    aria-label={`Quantity of ${line.name}`}
                />

                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => step(1)}
                    className="h-10 w-10 shrink-0"
                    aria-label={`One more ${line.name}`}
                >
                    <Plus className="h-4 w-4" />
                </Button>

                {oversold && (
                    <span
                        className={cn(
                            'ml-auto text-xs font-medium',
                            allowNegativeStock ? 'text-amber-600 dark:text-amber-500' : 'text-destructive',
                        )}
                    >
                        {onHand} in stock
                    </span>
                )}
            </div>

            {expanded && canExpand && (
                <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
                    {allowPriceOverride && (
                        <label className="grid gap-1">
                            <span className="text-xs text-muted-foreground">Unit price</span>
                            <Input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                value={line.unit_price}
                                onChange={(event) => onPatch({ unit_price: event.target.value })}
                                onFocus={(event) => event.target.select()}
                                className="h-10 tabular-nums"
                            />
                        </label>
                    )}
                    {allowLineDiscount && (
                        <label className="grid gap-1">
                            <span className="text-xs text-muted-foreground">Discount</span>
                            <Input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                value={line.discount_amount}
                                onChange={(event) => onPatch({ discount_amount: event.target.value })}
                                onFocus={(event) => event.target.select()}
                                className="h-10 tabular-nums"
                            />
                        </label>
                    )}
                </div>
            )}
        </div>
    );
}
