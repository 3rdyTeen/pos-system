import { money } from '@/components/pos/cart-summary';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useSale, useSaleOptions } from '@/hooks/sales/useSales';
import { useCreateSalesReturn } from '@/hooks/salesReturns/useSalesReturns';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { SalesReturnStatus } from '@/types';
import { useEffect, useMemo, useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Raise a refund against a completed sale.
 *
 * The quantities are the only thing entered: prices come off the original sale, so
 * the refund is always what was actually charged.
 */
export function SalesReturnSheet({ open, onOpenChange }: Props) {
    const [saleId, setSaleId] = useState('');
    const [reason, setReason] = useState('');
    const [refundMethod, setRefundMethod] = useState('');
    const [status, setStatus] = useState<SalesReturnStatus>('completed');
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    const { data: options } = useSaleOptions();
    const { data: sale, isPending: salePending } = useSale(saleId);
    const createReturn = useCreateSalesReturn();

    useEffect(() => {
        if (!open) {
            return;
        }

        setSaleId('');
        setReason('');
        setRefundMethod('');
        setStatus('completed');
        setQuantities({});
        setErrors({});
    }, [open]);

    // Picking a different sale invalidates any quantities typed against the old one.
    useEffect(() => {
        setQuantities({});
    }, [saleId]);

    const lines = useMemo(
        () =>
            Object.entries(quantities)
                .filter(([, quantity]) => Number(quantity) > 0)
                .map(([sales_detail_id, quantity]) => ({ sales_detail_id, quantity })),
        [quantities],
    );

    const total = useMemo(() => {
        if (!sale?.details) {
            return 0;
        }

        return sale.details.reduce((sum, detail) => {
            const quantity = Number(quantities[detail.id] ?? 0);

            return sum + quantity * Number(detail.unit_price);
        }, 0);
    }, [sale, quantities]);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        setErrors({});

        createReturn.mutate(
            {
                sale_id: saleId,
                return_date: null,
                reason,
                refund_method: refundMethod || null,
                status,
                lines,
            },
            {
                onSuccess: (response) => {
                    toast.success(`${response.data.return_number} raised.`);
                    onOpenChange(false);
                },
                onError: (error: Error) => {
                    if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
                        setErrors(error.errors);

                        return;
                    }

                    toast.error(error.message || 'Something went wrong.');
                },
            },
        );
    };

    // Line errors are positional, so map them back onto the row the cashier sees.
    const lineError = (index: number, field: string) => errors[`lines.${index}.${field}`]?.[0];
    const indexOf = (detailId: string) => lines.findIndex((line) => line.sales_detail_id === detailId);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>New return</SheetTitle>
                    <SheetDescription>Pick the sale, then how many of each item are coming back.</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="return-sale">Sale</Label>
                        <Select value={saleId} onValueChange={setSaleId}>
                            <SelectTrigger id="return-sale">
                                <SelectValue placeholder="Select a completed sale" />
                            </SelectTrigger>
                            <SelectContent>
                                {(options ?? []).map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.sale_number} &middot; {money(option.grand_total)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.sale_id?.[0]} />
                    </div>

                    {saleId !== '' && !salePending && sale && (
                        <div className="grid gap-2">
                            <Label>Items</Label>
                            <div className="grid gap-2 rounded-md border p-3">
                                {sale.details?.map((detail) => (
                                    <div key={detail.id} className="grid gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="flex-1 text-sm">{detail.product?.name ?? 'Item'}</span>
                                            <span className="text-xs text-muted-foreground">
                                                sold {detail.quantity} @ {money(detail.unit_price)}
                                            </span>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                max={detail.quantity}
                                                value={quantities[detail.id] ?? ''}
                                                onChange={(event) =>
                                                    setQuantities((prev) => ({ ...prev, [detail.id]: event.target.value }))
                                                }
                                                className="h-8 w-24"
                                                placeholder="0"
                                                aria-label={`Quantity returned for ${detail.product?.name ?? 'item'}`}
                                            />
                                        </div>
                                        <InputError message={lineError(indexOf(detail.id), 'quantity') ?? lineError(indexOf(detail.id), 'sales_detail_id')} />
                                    </div>
                                ))}
                            </div>
                            <InputError message={errors.lines?.[0]} />
                            <p className="text-right text-sm font-medium">Refund {money(total)}</p>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="return-status">Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as SalesReturnStatus)}>
                            <SelectTrigger id="return-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="completed">Completed (refund and restock now)</SelectItem>
                                <SelectItem value="pending">Pending (no stock movement yet)</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="return-refund-method">Refund method</Label>
                        <Input
                            id="return-refund-method"
                            value={refundMethod}
                            onChange={(event) => setRefundMethod(event.target.value)}
                            placeholder="Cash, card, store credit..."
                        />
                        <InputError message={errors.refund_method?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="return-reason">Reason</Label>
                        <Textarea id="return-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={2} />
                        <InputError message={errors.reason?.[0]} />
                    </div>
                </form>

                <SheetFooter className="mt-auto gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={submit} disabled={createReturn.isPending || saleId === '' || lines.length === 0}>
                        {createReturn.isPending ? 'Saving...' : 'Raise return'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
