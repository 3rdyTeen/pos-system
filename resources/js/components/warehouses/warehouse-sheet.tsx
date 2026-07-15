import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useBranchOptions } from '@/hooks/branches/useBranches';
import { useCreateWarehouse, useUpdateWarehouse } from '@/hooks/warehouses/useWarehouseMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Warehouse, WarehouseStatus } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface WarehouseSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    warehouse: Warehouse | null;
}

export function WarehouseSheet({ open, onOpenChange, warehouse }: WarehouseSheetProps) {
    const isEdit = warehouse !== null;
    const { data: branches = [] } = useBranchOptions();
    const createWarehouse = useCreateWarehouse();
    const updateWarehouse = useUpdateWarehouse();
    const processing = createWarehouse.isPending || updateWarehouse.isPending;

    const [branchId, setBranchId] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [address, setAddress] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [status, setStatus] = useState<WarehouseStatus>('active');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setBranchId(warehouse?.branch_id ?? '');
            setName(warehouse?.name ?? '');
            setCode(warehouse?.code ?? '');
            setAddress(warehouse?.address ?? '');
            setIsDefault(warehouse?.is_default ?? false);
            setStatus(warehouse?.status ?? 'active');
            setErrors({});
        }
    }, [open, warehouse]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            branch_id: branchId,
            name,
            code,
            address,
            is_default: isDefault,
            status,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Warehouse updated.' : 'Warehouse created.');
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
            updateWarehouse.mutate({ id: warehouse.id, ...payload }, { onSuccess, onError });
        } else {
            createWarehouse.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit warehouse' : 'New warehouse'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the warehouse details below.' : 'Add a location that holds stock.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="warehouse-branch">Branch</Label>
                        <Select value={branchId || undefined} onValueChange={setBranchId}>
                            <SelectTrigger id="warehouse-branch">
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
                        <Label htmlFor="warehouse-name">Name</Label>
                        <Input
                            id="warehouse-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Main Warehouse"
                            autoFocus
                        />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="warehouse-code">Code</Label>
                            <Input id="warehouse-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. WH-01" />
                            <InputError message={errors.code?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="warehouse-status">Status</Label>
                            <Select value={status} onValueChange={(value: WarehouseStatus) => setStatus(value)}>
                                <SelectTrigger id="warehouse-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="warehouse-address">Address</Label>
                        <Input id="warehouse-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                        <InputError message={errors.address?.[0]} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="warehouse-default">Default</Label>
                            <p className="text-muted-foreground text-sm">
                                The branch's default stock location. Only one branch warehouse can be default.
                            </p>
                        </div>
                        <Switch id="warehouse-default" checked={isDefault} onCheckedChange={setIsDefault} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create warehouse'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
