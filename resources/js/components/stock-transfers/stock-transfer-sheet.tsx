import InputError from '@/components/input-error';
import { StockLinesEditor } from '@/components/inventory/stock-lines-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCreateStockTransfer, useStockTransfer, useUpdateStockTransfer } from '@/hooks/stockTransfers/useStockTransfers';
import { useWarehouseOptions } from '@/hooks/warehouses/useWarehouses';
import { ApiError, ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { StockLineDraft, StockTransfer, StockTransferStatus } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface StockTransferSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transfer: StockTransfer | null;
}

export function StockTransferSheet({ open, onOpenChange, transfer }: StockTransferSheetProps) {
    const isEdit = transfer !== null;
    const { data: warehouses = [] } = useWarehouseOptions();
    const createTransfer = useCreateStockTransfer();
    const updateTransfer = useUpdateStockTransfer();
    const processing = createTransfer.isPending || updateTransfer.isPending;

    // The list response carries no lines, so the full record is fetched to hydrate them.
    const detailQuery = useStockTransfer(transfer?.id ?? '');

    const [fromWarehouseId, setFromWarehouseId] = useState('');
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [status, setStatus] = useState<StockTransferStatus>('draft');
    const [transferDate, setTransferDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<StockLineDraft[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (open) {
            setFromWarehouseId(transfer?.from_warehouse_id ?? '');
            setToWarehouseId(transfer?.to_warehouse_id ?? '');
            setStatus(transfer?.status ?? 'draft');
            setTransferDate(transfer?.transfer_date ?? '');
            setNotes(transfer?.notes ?? '');
            setLines([]);
            setErrors({});
            setHydrated(false);
        }
    }, [open, transfer]);

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
                    system_qty: '0',
                    counted_qty: '0',
                    quantity: detail.quantity,
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
            from_warehouse_id: fromWarehouseId,
            to_warehouse_id: toWarehouseId,
            status,
            transfer_date: transferDate || null,
            notes,
            details: lines.map((line) => ({
                product_id: line.product_id,
                product_variant_id: line.product_variant_id,
                quantity: line.quantity,
                unit_cost: line.unit_cost,
            })),
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Transfer updated.' : 'Transfer created.');
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
            updateTransfer.mutate({ id: transfer.id, ...payload }, { onSuccess, onError });
        } else {
            createTransfer.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-3xl">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? `Edit ${transfer.transfer_number}` : 'New transfer'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the transfer below.' : 'Move stock from one warehouse to another.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="transfer-from">From warehouse</Label>
                            <Select value={fromWarehouseId || undefined} onValueChange={setFromWarehouseId}>
                                <SelectTrigger id="transfer-from">
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
                            <InputError message={errors.from_warehouse_id?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="transfer-to">To warehouse</Label>
                            <Select value={toWarehouseId || undefined} onValueChange={setToWarehouseId}>
                                <SelectTrigger id="transfer-to">
                                    <SelectValue placeholder="Select a warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses
                                        // Stock cannot be transferred to where it already is.
                                        .filter((warehouse) => warehouse.id !== fromWarehouseId)
                                        .map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.to_warehouse_id?.[0]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="transfer-status">Status</Label>
                            <Select value={status} onValueChange={(value: StockTransferStatus) => setStatus(value)}>
                                <SelectTrigger id="transfer-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="in_transit">In transit</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="transfer-date">Date</Label>
                            <Input id="transfer-date" type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
                            <InputError message={errors.transfer_date?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="transfer-notes">Notes</Label>
                        <Input id="transfer-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        <InputError message={errors.notes?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Lines</Label>
                        <StockLinesEditor variant="transfer" rows={lines} onChange={setLines} errors={errors} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create transfer'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
