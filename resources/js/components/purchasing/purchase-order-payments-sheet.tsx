import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePaymentMethodOptions } from '@/hooks/paymentMethods/usePaymentMethods';
import { usePurchaseOrder } from '@/hooks/purchaseOrders/usePurchaseOrders';
import { useCreatePurchasePayment, useDeletePurchasePayment, usePurchasePayments } from '@/hooks/purchaseOrders/usePurchasePayments';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { PurchaseOrder } from '@/types';
import { Trash2 } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface PurchaseOrderPaymentsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: PurchaseOrder | null;
}

export function PurchaseOrderPaymentsSheet({ open, onOpenChange, order }: PurchaseOrderPaymentsSheetProps) {
    const orderId = order?.id ?? '';
    const { data: methods = [] } = usePaymentMethodOptions();
    const { data: payments = [] } = usePurchasePayments(orderId);
    // Re-read so paid_total and balance reflect payments added in this sheet.
    const orderQuery = usePurchaseOrder(orderId);
    const createPayment = useCreatePurchasePayment(orderId);
    const deletePayment = useDeletePurchasePayment(orderId);

    const [methodId, setMethodId] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setMethodId('');
            setAmount('');
            setReference('');
            setErrors({});
        }
    }, [open, order]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        createPayment.mutate(
            { payment_method_id: methodId, amount, reference_number: reference },
            {
                onSuccess: () => {
                    toast.success('Payment recorded.');
                    setAmount('');
                    setReference('');
                },
                onError: (error) => {
                    if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
                        setErrors(error.errors);
                    } else {
                        toast.error(error.message || 'Something went wrong.');
                    }
                },
            },
        );
    };

    const remove = (id: string) => {
        deletePayment.mutate(id, {
            onSuccess: () => toast.success('Payment deleted.'),
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Failed to delete payment.'),
        });
    };

    const current = orderQuery.data ?? order;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl">
                <SheetHeader className="text-left">
                    <SheetTitle>Payments for {order?.po_number}</SheetTitle>
                    <SheetDescription>Record what has been paid to the supplier against this order.</SheetDescription>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid grid-cols-3 gap-4 rounded-lg border p-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Order total</p>
                            <p className="font-medium">{current?.grand_total ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Paid</p>
                            <p className="font-medium">{current?.paid_total ?? '0.00'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Balance</p>
                            <p className="font-medium">{current?.balance ?? current?.grand_total ?? '—'}</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="grid gap-4 rounded-lg border p-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="payment-method">Method</Label>
                                <Select value={methodId || undefined} onValueChange={setMethodId}>
                                    <SelectTrigger id="payment-method">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {methods.map((method) => (
                                            <SelectItem key={method.id} value={method.id}>
                                                {method.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.payment_method_id?.[0]} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="payment-amount">Amount</Label>
                                <Input
                                    id="payment-amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                {/* The server refuses an amount beyond the outstanding balance. */}
                                <InputError message={errors.amount?.[0]} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="payment-reference">Reference</Label>
                                <Input id="payment-reference" value={reference} onChange={(e) => setReference(e.target.value)} />
                                <InputError message={errors.reference_number?.[0]} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={createPayment.isPending}>
                                Record payment
                            </Button>
                        </div>
                    </form>

                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                                            No payments recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{payment.payment_method?.name ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">{payment.reference_number || '—'}</TableCell>
                                        <TableCell>{payment.amount}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => remove(payment.id)}
                                                    disabled={deletePayment.isPending}
                                                    aria-label="Delete payment"
                                                >
                                                    <Trash2 className="text-destructive h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <SheetFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
