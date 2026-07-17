import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, ValidationErrors } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PosContext } from '@/types';
import { Delete } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { money, round2 } from './cart-summary';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    total: number;
    context: PosContext | undefined;
    isPending: boolean;
    onConfirm: (payments: { payment_method_id: string; amount: string; reference_number: string | null }[]) => void;
    error: Error | null;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

/**
 * Takes the tender for a sale.
 *
 * The amount recorded is what is applied to the sale, never the cash handed over —
 * change is not takings. The pad computes change locally for the cashier and sends
 * the applied figure, which is also what the server enforces.
 */
export function PaymentDialog({ open, onOpenChange, total, context, isPending, onConfirm, error }: Props) {
    const methods = context?.payment_methods ?? [];
    const quickTender = context?.profile.quick_tender ?? [];

    const [methodId, setMethodId] = useState('');
    const [tendered, setTendered] = useState('');
    const [reference, setReference] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (!open) {
            return;
        }

        setMethodId(methods[0]?.id ?? '');
        setTendered(total.toFixed(2));
        setReference('');
        setErrors({});
        // methods is a fresh array each render, so key off its identity-stable length.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, total, methods.length]);

    useEffect(() => {
        if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
            setErrors(error.errors);
        }
    }, [error]);

    const method = methods.find((m) => m.id === methodId);
    const isCash = method?.type === 'cash';

    const tenderedValue = Number(tendered || 0);
    // Only cash makes change; a card is charged for exactly what is owed.
    const change = useMemo(() => (isCash ? Math.max(round2(tenderedValue - total), 0) : 0), [isCash, tenderedValue, total]);
    const applied = round2(Math.min(tenderedValue, total));
    const shortfall = round2(total - applied);

    const press = (key: string) => {
        setTendered((prev) => {
            if (key === '.' && prev.includes('.')) {
                return prev;
            }

            return prev === '0' && key !== '.' ? key : prev + key;
        });
    };

    const submit = () => {
        if (!methodId || applied <= 0) {
            return;
        }

        onConfirm([{ payment_method_id: methodId, amount: applied.toFixed(2), reference_number: reference || null }]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Take payment</DialogTitle>
                    <DialogDescription>Record what is applied to the sale — change is handed back, not tendered.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {/* Tender type as buttons: usually two or three, and one tap beats a dropdown. */}
                    <div className="grid gap-2">
                        <Label>Method</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {methods.map((m) => (
                                <Button
                                    key={m.id}
                                    type="button"
                                    variant={methodId === m.id ? 'default' : 'outline'}
                                    onClick={() => setMethodId(m.id)}
                                    className="h-10"
                                >
                                    {m.name}
                                </Button>
                            ))}
                        </div>
                        <InputError message={errors['payments.0.payment_method_id']?.[0]} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div className="grid gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="tendered">{isCash ? 'Cash tendered' : 'Amount'}</Label>
                                <Input
                                    id="tendered"
                                    inputMode="decimal"
                                    value={tendered}
                                    onChange={(event) => setTendered(event.target.value.replace(/[^\d.]/g, ''))}
                                    onFocus={(event) => event.target.select()}
                                    className="h-12 text-right text-xl font-semibold tabular-nums"
                                    autoFocus
                                />
                            </div>

                            {isCash && quickTender.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    <Button type="button" variant="secondary" size="sm" onClick={() => setTendered(total.toFixed(2))} className="h-9">
                                        Exact
                                    </Button>
                                    {quickTender.map((amount) => (
                                        <Button
                                            key={amount}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setTendered(String(amount))}
                                            className="h-9 tabular-nums"
                                        >
                                            {amount}
                                        </Button>
                                    ))}
                                </div>
                            )}

                            <div className="rounded-lg border p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Due</span>
                                    <span className="tabular-nums">{money(total)}</span>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="text-muted-foreground">Applied</span>
                                    <span className="font-medium tabular-nums">{money(applied)}</span>
                                </div>
                                {isCash && (
                                    <div className="mt-2 flex items-baseline justify-between border-t pt-2">
                                        <span className="font-medium">Change</span>
                                        <span className="text-2xl font-bold tabular-nums">{money(change)}</span>
                                    </div>
                                )}
                                {shortfall > 0 && (
                                    <div className="mt-2 flex justify-between border-t pt-2 text-amber-600 dark:text-amber-500">
                                        <span>Still owing</span>
                                        <span className="font-medium tabular-nums">{money(shortfall)}</span>
                                    </div>
                                )}
                            </div>

                            {!isCash && (
                                <div className="grid gap-1.5">
                                    <Label htmlFor="reference">Reference</Label>
                                    <Input
                                        id="reference"
                                        value={reference}
                                        onChange={(event) => setReference(event.target.value)}
                                        placeholder="Auth code, last 4 digits..."
                                        className="h-10"
                                    />
                                    <InputError message={errors['payments.0.reference_number']?.[0]} />
                                </div>
                            )}

                            <InputError message={errors.payments?.[0] ?? errors.lines?.[0] ?? errors.status?.[0]} />
                        </div>

                        {/* Keypad: these terminals are touch-first and often have no keyboard. */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {KEYS.map((key) => (
                                <Button
                                    key={key}
                                    type="button"
                                    variant="outline"
                                    onClick={() => press(key)}
                                    className="h-12 w-14 text-lg font-medium"
                                >
                                    {key}
                                </Button>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setTendered((prev) => prev.slice(0, -1))}
                                className="h-12 w-14"
                                aria-label="Delete last digit"
                            >
                                <Delete className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">
                        Cancel
                    </Button>
                    <Button type="button" onClick={submit} disabled={isPending || !methodId || applied <= 0} className={cn('h-11 flex-1 text-base')}>
                        {isPending ? 'Taking payment...' : `Charge ${money(applied)}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
