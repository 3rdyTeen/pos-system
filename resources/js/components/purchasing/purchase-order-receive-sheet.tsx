import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { usePurchaseOrder, useReceivePurchaseOrder } from '@/hooks/purchaseOrders/usePurchaseOrders';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { PurchaseOrder } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface PurchaseOrderReceiveSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: PurchaseOrder | null;
}

interface ReceiveRow {
    purchase_detail_id: string;
    label: string;
    ordered: string;
    received_qty: string;
}

export function PurchaseOrderReceiveSheet({ open, onOpenChange, order }: PurchaseOrderReceiveSheetProps) {
    const receiveOrder = useReceivePurchaseOrder();
    const detailQuery = usePurchaseOrder(order?.id ?? '');

    const [rows, setRows] = useState<ReceiveRow[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (open) {
            setRows([]);
            setErrors({});
            setHydrated(false);
        }
    }, [open, order]);

    useEffect(() => {
        if (!open || hydrated || !detailQuery.isSuccess) {
            return;
        }

        setRows(
            (detailQuery.data?.details ?? []).map((detail) => ({
                purchase_detail_id: detail.id,
                label: detail.product?.name ?? 'Product',
                ordered: detail.quantity,
                received_qty: detail.received_qty,
            })),
        );
        setHydrated(true);
    }, [open, hydrated, detailQuery.isSuccess, detailQuery.data]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        if (!order) {
            return;
        }

        receiveOrder.mutate(
            {
                id: order.id,
                lines: rows.map((row) => ({ purchase_detail_id: row.purchase_detail_id, received_qty: row.received_qty })),
            },
            {
                onSuccess: () => {
                    toast.success('Receipt recorded.');
                    onOpenChange(false);
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

    const receiveAll = () => setRows((prev) => prev.map((row) => ({ ...row, received_qty: row.ordered })));

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
                <SheetHeader className="text-left">
                    <SheetTitle>Receive {order?.po_number}</SheetTitle>
                    <SheetDescription>
                        Record what arrived. The order status follows from this. Receiving does not move stock yet.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    {/* Raised by the server when the order is a draft or cancelled. */}
                    <InputError message={errors.status?.[0]} />

                    {rows.length === 0 && <p className="text-muted-foreground text-sm">This order has no lines to receive.</p>}

                    {rows.length > 0 && (
                        <div className="flex justify-end">
                            <Button type="button" variant="outline" size="sm" onClick={receiveAll}>
                                Receive all
                            </Button>
                        </div>
                    )}

                    {rows.map((row, index) => (
                        <div key={row.purchase_detail_id} className="grid gap-2 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{row.label}</p>
                                <p className="text-muted-foreground text-sm">Ordered: {row.ordered}</p>
                            </div>
                            <Label htmlFor={`receive-${row.purchase_detail_id}`}>Received quantity</Label>
                            <Input
                                id={`receive-${row.purchase_detail_id}`}
                                type="number"
                                step="0.0001"
                                min="0"
                                value={row.received_qty}
                                onChange={(e) =>
                                    setRows((prev) =>
                                        prev.map((candidate) =>
                                            candidate.purchase_detail_id === row.purchase_detail_id
                                                ? { ...candidate, received_qty: e.target.value }
                                                : candidate,
                                        ),
                                    )
                                }
                            />
                            <InputError message={errors[`lines.${index}.received_qty`]?.[0]} />
                            <InputError message={errors[`lines.${index}.purchase_detail_id`]?.[0]} />
                        </div>
                    ))}

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={receiveOrder.isPending || rows.length === 0}>
                            Record receipt
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
