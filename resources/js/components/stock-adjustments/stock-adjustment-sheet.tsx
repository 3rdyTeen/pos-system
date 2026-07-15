import InputError from '@/components/input-error';
import { StockLinesEditor } from '@/components/inventory/stock-lines-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCreateStockAdjustment, useStockAdjustment, useUpdateStockAdjustment } from '@/hooks/stockAdjustments/useStockAdjustments';
import { useWarehouseOptions } from '@/hooks/warehouses/useWarehouses';
import { ApiError, ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { StockAdjustment, StockAdjustmentStatus, StockLineDraft } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface StockAdjustmentSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    adjustment: StockAdjustment | null;
}

export function StockAdjustmentSheet({ open, onOpenChange, adjustment }: StockAdjustmentSheetProps) {
    const isEdit = adjustment !== null;
    const { data: warehouses = [] } = useWarehouseOptions();
    const createAdjustment = useCreateStockAdjustment();
    const updateAdjustment = useUpdateStockAdjustment();
    const processing = createAdjustment.isPending || updateAdjustment.isPending;

    // The list response carries no lines, so the full record is fetched to hydrate them.
    const detailQuery = useStockAdjustment(adjustment?.id ?? '');

    const [warehouseId, setWarehouseId] = useState('');
    const [reason, setReason] = useState('');
    const [status, setStatus] = useState<StockAdjustmentStatus>('draft');
    const [adjustmentDate, setAdjustmentDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<StockLineDraft[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (open) {
            setWarehouseId(adjustment?.warehouse_id ?? '');
            setReason(adjustment?.reason ?? '');
            setStatus(adjustment?.status ?? 'draft');
            setAdjustmentDate(adjustment?.adjustment_date ?? '');
            setNotes(adjustment?.notes ?? '');
            setLines([]);
            setErrors({});
            setHydrated(false);
        }
    }, [open, adjustment]);

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
                    system_qty: detail.system_qty,
                    counted_qty: detail.counted_qty,
                    quantity: '1',
                    unit_cost: detail.unit_cost,
                })),
            );
            setHydrated(true);
        }
    }, [open, hydrated, isEdit, detailQuery.isSuccess, detailQuery.data]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            warehouse_id: warehouseId,
            reason,
            status,
            adjustment_date: adjustmentDate || null,
            notes,
            details: lines.map((line) => ({
                product_id: line.product_id,
                product_variant_id: line.product_variant_id,
                system_qty: line.system_qty,
                counted_qty: line.counted_qty,
                unit_cost: line.unit_cost,
            })),
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Adjustment updated.' : 'Adjustment created.');
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
            updateAdjustment.mutate({ id: adjustment.id, ...payload }, { onSuccess, onError });
        } else {
            createAdjustment.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-3xl">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? `Edit ${adjustment.adjustment_number}` : 'New adjustment'}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? 'Update the counted quantities below.' : 'Record a physical count against the system quantity.'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="adjustment-warehouse">Warehouse</Label>
                            <Select value={warehouseId || undefined} onValueChange={setWarehouseId}>
                                <SelectTrigger id="adjustment-warehouse">
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
                        <div className="grid gap-2">
                            <Label htmlFor="adjustment-status">Status</Label>
                            <Select value={status} onValueChange={(value: StockAdjustmentStatus) => setStatus(value)}>
                                <SelectTrigger id="adjustment-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status?.[0]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="adjustment-reason">Reason</Label>
                            <Input id="adjustment-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Cycle count" />
                            <InputError message={errors.reason?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="adjustment-date">Date</Label>
                            <Input id="adjustment-date" type="date" value={adjustmentDate} onChange={(e) => setAdjustmentDate(e.target.value)} />
                            <InputError message={errors.adjustment_date?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="adjustment-notes">Notes</Label>
                        <Input id="adjustment-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        <InputError message={errors.notes?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Lines</Label>
                        <StockLinesEditor variant="adjustment" rows={lines} onChange={setLines} errors={errors} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create adjustment'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
