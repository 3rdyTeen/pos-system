import InputError from '@/components/input-error';
import { PurchaseLinesEditor, previewTotals } from '@/components/purchasing/purchase-lines-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useBranchOptions } from '@/hooks/branches/useBranches';
import { useCreatePurchaseOrder, usePurchaseOrder, useUpdatePurchaseOrder } from '@/hooks/purchaseOrders/usePurchaseOrders';
import { useSupplierOptions } from '@/hooks/suppliers/useSuppliers';
import { useWarehouseOptions } from '@/hooks/warehouses/useWarehouses';
import { ApiError, ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { PurchaseLineDraft, PurchaseOrder, PurchaseOrderStatus } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface PurchaseOrderSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: PurchaseOrder | null;
}

export function PurchaseOrderSheet({ open, onOpenChange, order }: PurchaseOrderSheetProps) {
    const isEdit = order !== null;
    const { data: branches = [] } = useBranchOptions();
    const { data: warehouses = [] } = useWarehouseOptions();
    const { data: suppliers = [] } = useSupplierOptions();
    const createOrder = useCreatePurchaseOrder();
    const updateOrder = useUpdatePurchaseOrder();
    const processing = createOrder.isPending || updateOrder.isPending;

    // The list response carries no lines, so the full record is fetched to hydrate them.
    const detailQuery = usePurchaseOrder(order?.id ?? '');

    const [branchId, setBranchId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [orderDate, setOrderDate] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [status, setStatus] = useState<PurchaseOrderStatus>('draft');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<PurchaseLineDraft[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (open) {
            setBranchId(order?.branch_id ?? '');
            setWarehouseId(order?.warehouse_id ?? '');
            setSupplierId(order?.supplier_id ?? '');
            setOrderDate(order?.order_date ?? '');
            setExpectedDate(order?.expected_date ?? '');
            setStatus(order?.status ?? 'draft');
            setNotes(order?.notes ?? '');
            setLines([]);
            setErrors({});
            setHydrated(false);
        }
    }, [open, order]);

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
                    product_id: detail.product_id,
                    product_variant_id: detail.product_variant_id,
                    quantity: detail.quantity,
                    unit_cost: detail.unit_cost,
                    tax_amount: detail.tax_amount,
                    discount_amount: detail.discount_amount,
                })),
            );
            setHydrated(true);
        }
    }, [open, hydrated, isEdit, detailQuery.isSuccess, detailQuery.data]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        // No totals are sent: the server derives them from these lines.
        const payload = {
            branch_id: branchId,
            warehouse_id: warehouseId,
            supplier_id: supplierId,
            order_date: orderDate || null,
            expected_date: expectedDate || null,
            status,
            notes,
            details: lines.map((line) => ({
                product_id: line.product_id,
                product_variant_id: line.product_variant_id,
                quantity: line.quantity,
                unit_cost: line.unit_cost,
                tax_amount: line.tax_amount,
                discount_amount: line.discount_amount,
            })),
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Purchase order updated.' : 'Purchase order created.');
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
            updateOrder.mutate({ id: order.id, ...payload }, { onSuccess, onError });
        } else {
            createOrder.mutate(payload, { onSuccess, onError });
        }
    };

    const totals = previewTotals(lines);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-3xl">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? `Edit ${order.po_number}` : 'New purchase order'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the order below.' : 'Raise an order with a supplier.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="po-supplier">Supplier</Label>
                            <Select value={supplierId || undefined} onValueChange={setSupplierId}>
                                <SelectTrigger id="po-supplier">
                                    <SelectValue placeholder="Select a supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.supplier_id?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="po-status">Status</Label>
                            <Select value={status} onValueChange={(value: PurchaseOrderStatus) => setStatus(value)}>
                                <SelectTrigger id="po-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="ordered">Ordered</SelectItem>
                                    <SelectItem value="partially_received">Partially received</SelectItem>
                                    <SelectItem value="received">Received</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status?.[0]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="po-branch">Branch</Label>
                            <Select value={branchId || undefined} onValueChange={setBranchId}>
                                <SelectTrigger id="po-branch">
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
                        <div className="grid gap-2">
                            <Label htmlFor="po-warehouse">Deliver to warehouse</Label>
                            <Select value={warehouseId || undefined} onValueChange={setWarehouseId}>
                                <SelectTrigger id="po-warehouse">
                                    <SelectValue placeholder="Select a warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((warehouse) => (
                                        <SelectItem key={warehouse.id} value={warehouse.id}>
                                            {warehouse.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.warehouse_id?.[0]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="po-order-date">Order date</Label>
                            <Input id="po-order-date" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
                            <InputError message={errors.order_date?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="po-expected-date">Expected date</Label>
                            <Input id="po-expected-date" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                            <InputError message={errors.expected_date?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="po-notes">Notes</Label>
                        <Input id="po-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        <InputError message={errors.notes?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Lines</Label>
                        <PurchaseLinesEditor rows={lines} onChange={setLines} errors={errors} />
                    </div>

                    {/* Preview only — the server recomputes these and its answer wins. */}
                    <div className="grid gap-1 rounded-lg border p-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax</span>
                            <span>{totals.taxTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Discount</span>
                            <span>-{totals.discountTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-medium">
                            <span>Grand total</span>
                            <span>{totals.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create order'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
