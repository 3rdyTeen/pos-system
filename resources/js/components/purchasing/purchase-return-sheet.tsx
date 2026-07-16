import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useBranchOptions } from '@/hooks/branches/useBranches';
import { usePurchaseOrder, usePurchaseOrderOptions } from '@/hooks/purchaseOrders/usePurchaseOrders';
import { useCreatePurchaseReturn, usePurchaseReturn, useUpdatePurchaseReturn } from '@/hooks/purchaseReturns/usePurchaseReturns';
import { ApiError, ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { PurchaseReturn, PurchaseReturnLineDraft, PurchaseReturnStatus } from '@/types';
import { Plus, X } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface PurchaseReturnSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseReturn: PurchaseReturn | null;
}

const NONE_VALUE = 'none';

export function PurchaseReturnSheet({ open, onOpenChange, purchaseReturn }: PurchaseReturnSheetProps) {
    const isEdit = purchaseReturn !== null;
    const { data: branches = [] } = useBranchOptions();
    const { data: orders = [] } = usePurchaseOrderOptions();
    const createReturn = useCreatePurchaseReturn();
    const updateReturn = useUpdatePurchaseReturn();
    const processing = createReturn.isPending || updateReturn.isPending;

    const detailQuery = usePurchaseReturn(purchaseReturn?.id ?? '');

    const [orderId, setOrderId] = useState('');
    const [branchId, setBranchId] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [reason, setReason] = useState('');
    const [status, setStatus] = useState<PurchaseReturnStatus>('completed');
    const [lines, setLines] = useState<PurchaseReturnLineDraft[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [hydrated, setHydrated] = useState(false);

    // The lines of the order being returned against — a return line must map to one.
    const orderQuery = usePurchaseOrder(orderId);
    const orderLines = orderQuery.data?.details ?? [];

    useEffect(() => {
        if (open) {
            setOrderId(purchaseReturn?.purchase_order_id ?? '');
            setBranchId(purchaseReturn?.branch_id ?? '');
            setReturnDate(purchaseReturn?.return_date ?? '');
            setReason(purchaseReturn?.reason ?? '');
            setStatus(purchaseReturn?.status ?? 'completed');
            setLines([]);
            setErrors({});
            setHydrated(false);
        }
    }, [open, purchaseReturn]);

    // Hydrate lines once per opening, so a refetch never overwrites edits in progress.
    useEffect(() => {
        if (!open || hydrated) {
            return;
        }

        if (!isEdit) {
            setHydrated(true);
            return;
        }

        if (detailQuery.isSuccess) {
            setLines(
                (detailQuery.data?.details ?? []).map((detail) => ({
                    key: uid(),
                    purchase_detail_id: detail.purchase_detail_id,
                    product_id: detail.product_id,
                    product_variant_id: detail.product_variant_id,
                    quantity: detail.quantity,
                    unit_cost: detail.unit_cost,
                })),
            );
            setHydrated(true);
        }
    }, [open, hydrated, isEdit, detailQuery.isSuccess, detailQuery.data]);

    const updateLine = (key: string, patch: Partial<PurchaseReturnLineDraft>) => {
        setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
    };

    /** Picking an order line copies its product and cost onto the return line. */
    const pickOrderLine = (key: string, purchaseDetailId: string) => {
        const source = orderLines.find((line) => line.id === purchaseDetailId);

        updateLine(key, {
            purchase_detail_id: purchaseDetailId,
            product_id: source?.product_id ?? '',
            product_variant_id: source?.product_variant_id ?? null,
            unit_cost: source?.unit_cost ?? '0',
        });
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        // No total is sent: the server derives it from these lines.
        const payload = {
            purchase_order_id: orderId,
            branch_id: branchId,
            return_date: returnDate || null,
            reason,
            status,
            details: lines.map((line) => ({
                purchase_detail_id: line.purchase_detail_id,
                product_id: line.product_id,
                product_variant_id: line.product_variant_id,
                quantity: line.quantity,
                unit_cost: line.unit_cost,
            })),
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Return updated.' : 'Return created.');
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
            updateReturn.mutate({ id: purchaseReturn.id, ...payload }, { onSuccess, onError });
        } else {
            createReturn.mutate(payload, { onSuccess, onError });
        }
    };

    const total = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_cost || 0), 0);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-3xl">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? `Edit ${purchaseReturn.return_number}` : 'New return'}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? 'Update the return below.' : 'Return goods to a supplier against a purchase order.'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="return-order">Purchase order</Label>
                            <Select
                                value={orderId || undefined}
                                // Lines reference the order's own lines, so switching order clears them.
                                onValueChange={(value) => {
                                    setOrderId(value);
                                    setLines([]);
                                }}
                            >
                                <SelectTrigger id="return-order">
                                    <SelectValue placeholder="Select an order" />
                                </SelectTrigger>
                                <SelectContent>
                                    {orders.map((option) => (
                                        <SelectItem key={option.id} value={option.id}>
                                            {option.po_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.purchase_order_id?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="return-branch">Branch</Label>
                            <Select value={branchId || undefined} onValueChange={setBranchId}>
                                <SelectTrigger id="return-branch">
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.branch_id?.[0]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="return-date">Return date</Label>
                            <Input id="return-date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                            <InputError message={errors.return_date?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="return-reason">Reason</Label>
                            <Input id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damaged" />
                            <InputError message={errors.reason?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="return-status">Status</Label>
                            <Select value={status} onValueChange={(value: PurchaseReturnStatus) => setStatus(value)}>
                                <SelectTrigger id="return-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Lines</Label>

                        {!orderId && <p className="text-muted-foreground text-sm">Select a purchase order first to choose the lines being returned.</p>}

                        {orderId && lines.length === 0 && <p className="text-muted-foreground text-sm">No lines yet.</p>}

                        {orderId &&
                            lines.map((line, index) => (
                                <div key={line.key} className="grid gap-4 rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Line {index + 1}</p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setLines((prev) => prev.filter((candidate) => candidate.key !== line.key))}
                                            aria-label="Remove line"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor={`return-line-${line.key}`}>Order line</Label>
                                        <Select
                                            value={line.purchase_detail_id ?? NONE_VALUE}
                                            onValueChange={(value) =>
                                                value === NONE_VALUE
                                                    ? updateLine(line.key, { purchase_detail_id: null })
                                                    : pickOrderLine(line.key, value)
                                            }
                                        >
                                            <SelectTrigger id={`return-line-${line.key}`}>
                                                <SelectValue placeholder="Select a line" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                                {orderLines.map((option) => (
                                                    <SelectItem key={option.id} value={option.id}>
                                                        {option.product?.name ?? 'Product'} — {option.quantity} @ {option.unit_cost}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors[`details.${index}.purchase_detail_id`]?.[0]} />
                                        <InputError message={errors[`details.${index}.product_id`]?.[0]} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor={`return-qty-${line.key}`}>Quantity</Label>
                                            <Input
                                                id={`return-qty-${line.key}`}
                                                type="number"
                                                step="0.0001"
                                                min="0"
                                                value={line.quantity}
                                                onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                                            />
                                            <InputError message={errors[`details.${index}.quantity`]?.[0]} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor={`return-cost-${line.key}`}>Unit cost</Label>
                                            <Input
                                                id={`return-cost-${line.key}`}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.unit_cost}
                                                onChange={(e) => updateLine(line.key, { unit_cost: e.target.value })}
                                            />
                                            <InputError message={errors[`details.${index}.unit_cost`]?.[0]} />
                                        </div>
                                    </div>

                                    <p className="text-muted-foreground text-sm">
                                        Line total: {(Number(line.quantity || 0) * Number(line.unit_cost || 0)).toFixed(2)}
                                    </p>
                                </div>
                            ))}

                        {orderId && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setLines((prev) => [
                                        ...prev,
                                        { key: uid(), purchase_detail_id: null, product_id: '', product_variant_id: null, quantity: '1', unit_cost: '0' },
                                    ])
                                }
                            >
                                <Plus className="h-4 w-4" />
                                Add line
                            </Button>
                        )}
                    </div>

                    {/* Preview only — the server recomputes this and its answer wins. */}
                    <div className="flex justify-between rounded-lg border p-4 text-sm font-medium">
                        <span>Total</span>
                        <span>{total.toFixed(2)}</span>
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create return'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
