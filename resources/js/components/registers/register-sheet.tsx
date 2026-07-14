import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useBranchOptions } from '@/hooks/branches/useBranches';
import { useCreateRegister, useUpdateRegister } from '@/hooks/registers/useRegisterMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Register } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface RegisterSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    register: Register | null;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

export function RegisterSheet({ open, onOpenChange, register }: RegisterSheetProps) {
    const isEdit = register !== null;
    const { data: branches = [] } = useBranchOptions();
    const createRegister = useCreateRegister();
    const updateRegister = useUpdateRegister();
    const processing = createRegister.isPending || updateRegister.isPending;

    const [branchId, setBranchId] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [codeTouched, setCodeTouched] = useState(false);
    const [ipAddress, setIpAddress] = useState('');
    const [status, setStatus] = useState('closed');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setBranchId(register?.branch_id ?? '');
            setName(register?.name ?? '');
            setCode(register?.code ?? '');
            setCodeTouched(isEdit);
            setIpAddress(register?.ip_address ?? '');
            setStatus(register?.status ?? 'closed');
            setErrors({});
        }
    }, [open, register, isEdit]);

    const handleName = (value: string) => {
        setName(value);
        if (!codeTouched) {
            setCode(slugify(value));
        }
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            branch_id: branchId,
            name,
            code,
            ip_address: ipAddress,
            status,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Register updated.' : 'Register created.');
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
            updateRegister.mutate({ id: register.id, ...payload }, { onSuccess, onError });
        } else {
            createRegister.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit register' : 'New register'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the register details below.' : 'Create a register at a branch.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="register-branch">Branch</Label>
                        <Select value={branchId || undefined} onValueChange={setBranchId}>
                            <SelectTrigger id="register-branch">
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
                        <Label htmlFor="register-name">Name</Label>
                        <Input id="register-name" value={name} onChange={(e) => handleName(e.target.value)} autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="register-code">Code</Label>
                        <Input
                            id="register-code"
                            value={code}
                            onChange={(e) => {
                                setCodeTouched(true);
                                setCode(e.target.value);
                            }}
                            placeholder="e.g. reg-01"
                        />
                        <InputError message={errors.code?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="register-ip">IP address</Label>
                        <Input id="register-ip" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="e.g. 192.168.1.10" />
                        <InputError message={errors.ip_address?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="register-status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="register-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.[0]} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create register'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
