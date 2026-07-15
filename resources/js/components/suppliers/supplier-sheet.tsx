import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/suppliers/useSupplierMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Supplier, SupplierStatus } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface SupplierSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier: Supplier | null;
}

export function SupplierSheet({ open, onOpenChange, supplier }: SupplierSheetProps) {
    const isEdit = supplier !== null;
    const { data: companies = [] } = useCompanyOptions();
    const createSupplier = useCreateSupplier();
    const updateSupplier = useUpdateSupplier();
    const processing = createSupplier.isPending || updateSupplier.isPending;

    const [companyId, setCompanyId] = useState('');
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [taxId, setTaxId] = useState('');
    const [status, setStatus] = useState<SupplierStatus>('active');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setCompanyId(supplier?.company_id ?? '');
            setName(supplier?.name ?? '');
            setContactPerson(supplier?.contact_person ?? '');
            setEmail(supplier?.email ?? '');
            setPhone(supplier?.phone ?? '');
            setAddress(supplier?.address ?? '');
            setTaxId(supplier?.tax_id ?? '');
            setStatus(supplier?.status ?? 'active');
            setErrors({});
        }
    }, [open, supplier]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            company_id: companyId,
            name,
            contact_person: contactPerson,
            email,
            phone,
            address,
            tax_id: taxId,
            status,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Supplier updated.' : 'Supplier created.');
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
            updateSupplier.mutate({ id: supplier.id, ...payload }, { onSuccess, onError });
        } else {
            createSupplier.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit supplier' : 'New supplier'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the supplier details below.' : 'Add a supplier you purchase stock from.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="supplier-company">Company</Label>
                        <Select value={companyId || undefined} onValueChange={setCompanyId}>
                            <SelectTrigger id="supplier-company">
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
                        <Label htmlFor="supplier-name">Name</Label>
                        <Input
                            id="supplier-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Metro Beverage Distributors"
                            autoFocus
                        />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="supplier-contact">Contact person</Label>
                            <Input
                                id="supplier-contact"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                placeholder="e.g. Jane Cruz"
                            />
                            <InputError message={errors.contact_person?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="supplier-phone">Phone</Label>
                            <Input id="supplier-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +63 912 345 6789" />
                            <InputError message={errors.phone?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="supplier-email">Email</Label>
                        <Input
                            id="supplier-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. sales@metrobev.com"
                        />
                        <InputError message={errors.email?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="supplier-address">Address</Label>
                        <Input id="supplier-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                        <InputError message={errors.address?.[0]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="supplier-tax">Tax ID</Label>
                            <Input id="supplier-tax" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="e.g. 123-456-789" />
                            <InputError message={errors.tax_id?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="supplier-status">Status</Label>
                            <Select value={status} onValueChange={(value: SupplierStatus) => setStatus(value)}>
                                <SelectTrigger id="supplier-status">
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

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create supplier'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
