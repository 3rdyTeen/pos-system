import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBranch, useUpdateBranch } from '@/hooks/branches/useBranchMutations';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Branch } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface BranchSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branch: Branch | null;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

export function BranchSheet({ open, onOpenChange, branch }: BranchSheetProps) {
    const isEdit = branch !== null;
    const { data: companies = [] } = useCompanyOptions();
    const createBranch = useCreateBranch();
    const updateBranch = useUpdateBranch();
    const processing = createBranch.isPending || updateBranch.isPending;

    const [companyId, setCompanyId] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [codeTouched, setCodeTouched] = useState(false);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isMainBranch, setIsMainBranch] = useState(false);
    const [status, setStatus] = useState('active');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setCompanyId(branch?.company_id ?? '');
            setName(branch?.name ?? '');
            setCode(branch?.code ?? '');
            setCodeTouched(isEdit);
            setAddress(branch?.address ?? '');
            setPhone(branch?.phone ?? '');
            setEmail(branch?.email ?? '');
            setIsMainBranch(branch?.is_main_branch ?? false);
            setStatus(branch?.status ?? 'active');
            setErrors({});
        }
    }, [open, branch, isEdit]);

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
            company_id: companyId,
            name,
            code,
            address,
            phone,
            email,
            is_main_branch: isMainBranch,
            status,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Branch updated.' : 'Branch created.');
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
            updateBranch.mutate({ id: branch.id, ...payload }, { onSuccess, onError });
        } else {
            createBranch.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit branch' : 'New branch'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the branch details below.' : 'Create a branch under a company.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="branch-company">Company</Label>
                        <Select value={companyId || undefined} onValueChange={setCompanyId}>
                            <SelectTrigger id="branch-company">
                                <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                        {company.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.company_id?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="branch-name">Name</Label>
                        <Input id="branch-name" value={name} onChange={(e) => handleName(e.target.value)} autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="branch-code">Code</Label>
                        <Input
                            id="branch-code"
                            value={code}
                            onChange={(e) => {
                                setCodeTouched(true);
                                setCode(e.target.value);
                            }}
                            placeholder="e.g. main-branch"
                        />
                        <InputError message={errors.code?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="branch-address">Address</Label>
                        <Textarea id="branch-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                        <InputError message={errors.address?.[0]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="branch-phone">Phone</Label>
                            <Input id="branch-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            <InputError message={errors.phone?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="branch-email">Email</Label>
                            <Input id="branch-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <InputError message={errors.email?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="branch-status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="branch-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.[0]} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox id="branch-main" checked={isMainBranch} onCheckedChange={(checked) => setIsMainBranch(checked === true)} />
                        <Label htmlFor="branch-main">Main branch</Label>
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create branch'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
