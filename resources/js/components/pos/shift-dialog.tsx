import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { ApiError, ValidationErrors } from '@/lib/api';
import { ShiftReconciliation } from '@/types';
import { useEffect, useState } from 'react';
import { money } from './cart-summary';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'open' | 'close';
    reconciliation: ShiftReconciliation | null;
    isPending: boolean;
    error: Error | null;
    onConfirm: (balance: string, notes: string) => void;
}

/**
 * Opens a drawer with a starting float, or closes it against a counted figure.
 *
 * On close the expected total is shown only after the cashier has typed a count,
 * so they count the till rather than the screen.
 */
export function ShiftDialog({ open, onOpenChange, mode, reconciliation, isPending, error, onConfirm }: Props) {
    const [balance, setBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (!open) {
            return;
        }

        setBalance('');
        setNotes('');
        setErrors({});
    }, [open]);

    useEffect(() => {
        if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
            setErrors(error.errors);
        }
    }, [error]);

    const counted = balance === '' ? null : Number(balance);
    const variance = counted !== null && reconciliation ? counted - reconciliation.expected_cash : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === 'open' ? 'Open the drawer' : 'Close the drawer'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'open'
                            ? 'Count the float you are starting with.'
                            : 'Count the cash in the drawer and enter the total.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="shift-balance">{mode === 'open' ? 'Opening float' : 'Counted cash'}</Label>
                        <Input
                            id="shift-balance"
                            type="number"
                            step="0.01"
                            min="0"
                            value={balance}
                            onChange={(event) => setBalance(event.target.value)}
                            autoFocus
                        />
                        <InputError message={errors.opening_balance?.[0] ?? errors.closing_balance?.[0] ?? errors.register_id?.[0] ?? errors.status?.[0]} />
                    </div>

                    {mode === 'close' && reconciliation && (
                        <div className="rounded-md border p-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Opening float</span>
                                <span>{money(reconciliation.opening_balance)}</span>
                            </div>
                            <div className="mt-1 flex justify-between">
                                <span className="text-muted-foreground">Cash taken ({reconciliation.sales_count} sales)</span>
                                <span>{money(reconciliation.cash_taken)}</span>
                            </div>
                            <div className="mt-1 flex justify-between font-medium">
                                <span>Expected in drawer</span>
                                <span>{money(reconciliation.expected_cash)}</span>
                            </div>
                            {variance !== null && (
                                <div
                                    className={`mt-2 flex justify-between border-t pt-2 font-medium ${
                                        Math.abs(variance) < 0.005
                                            ? 'text-emerald-600 dark:text-emerald-500'
                                            : 'text-destructive'
                                    }`}
                                >
                                    <span>{variance < 0 ? 'Short by' : variance > 0 ? 'Over by' : 'Balanced'}</span>
                                    <span>{money(Math.abs(variance))}</span>
                                </div>
                            )}
                            {reconciliation.other_taken > 0 && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {money(reconciliation.other_taken)} was taken on non-cash tenders and is not counted here.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="shift-notes">Notes</Label>
                        <Textarea id="shift-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
                        <InputError message={errors.notes?.[0]} />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={() => onConfirm(balance, notes)} disabled={isPending || balance === ''}>
                        {isPending ? 'Saving...' : mode === 'open' ? 'Open drawer' : 'Close drawer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
