import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useCustomerGroupOptions } from '@/hooks/customerGroups/useCustomerGroups';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/customers/useCustomerMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Customer, CustomerStatus } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface CustomerSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
}

const NONE_VALUE = 'none';

export function CustomerSheet({ open, onOpenChange, customer }: CustomerSheetProps) {
    const isEdit = customer !== null;
    const { data: companies = [] } = useCompanyOptions();
    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();
    const processing = createCustomer.isPending || updateCustomer.isPending;

    const [companyId, setCompanyId] = useState('');
    const [groupId, setGroupId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [taxId, setTaxId] = useState('');
    const [creditLimit, setCreditLimit] = useState('0');
    const [status, setStatus] = useState<CustomerStatus>('active');
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Groups are scoped to the selected company.
    const { data: groups = [] } = useCustomerGroupOptions(companyId || undefined);

    useEffect(() => {
        if (open) {
            setCompanyId(customer?.company_id ?? '');
            setGroupId(customer?.customer_group_id ?? '');
            setName(customer?.name ?? '');
            setEmail(customer?.email ?? '');
            setPhone(customer?.phone ?? '');
            setAddress(customer?.address ?? '');
            setTaxId(customer?.tax_id ?? '');
            setCreditLimit(customer?.credit_limit ?? '0');
            setStatus(customer?.status ?? 'active');
            setErrors({});
        }
    }, [open, customer]);

    // The group list is company-scoped, so a group picked under the old company is
    // no longer valid — the backend rejects that pairing.
    const resetCompanyScoped = (value: string) => {
        setCompanyId(value);
        setGroupId('');
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            company_id: companyId,
            customer_group_id: groupId || null,
            name,
            email,
            phone,
            address,
            tax_id: taxId,
            credit_limit: creditLimit,
            status,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Customer updated.' : 'Customer created.');
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
            updateCustomer.mutate({ id: customer.id, ...payload }, { onSuccess, onError });
        } else {
            createCustomer.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit customer' : 'New customer'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the customer details below.' : 'Add a customer to your directory.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="customer-company">Company</Label>
                        <Select value={companyId || undefined} onValueChange={resetCompanyScoped}>
                            <SelectTrigger id="customer-company">
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
                        <Label htmlFor="customer-name">Name</Label>
                        <Input
                            id="customer-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Juan dela Cruz"
                            autoFocus
                        />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="customer-group">Group</Label>
                        <Select value={groupId || NONE_VALUE} onValueChange={(value) => setGroupId(value === NONE_VALUE ? '' : value)}>
                            <SelectTrigger id="customer-group">
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                {groups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name} ({group.discount_percentage}%)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.customer_group_id?.[0]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="customer-email">Email</Label>
                            <Input
                                id="customer-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. juan@example.com"
                            />
                            <InputError message={errors.email?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="customer-phone">Phone</Label>
                            <Input id="customer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +63 912 345 6789" />
                            <InputError message={errors.phone?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="customer-address">Address</Label>
                        <Input id="customer-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                        <InputError message={errors.address?.[0]} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="customer-tax">Tax ID</Label>
                            <Input id="customer-tax" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                            <InputError message={errors.tax_id?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="customer-credit">Credit limit</Label>
                            <Input
                                id="customer-credit"
                                type="number"
                                step="0.01"
                                min="0"
                                value={creditLimit}
                                onChange={(e) => setCreditLimit(e.target.value)}
                            />
                            <InputError message={errors.credit_limit?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="customer-status">Status</Label>
                            <Select value={status} onValueChange={(value: CustomerStatus) => setStatus(value)}>
                                <SelectTrigger id="customer-status">
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
                            {isEdit ? 'Save changes' : 'Create customer'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
