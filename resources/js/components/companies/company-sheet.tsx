import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCompany, useUpdateCompany } from '@/hooks/companies/useCompanyMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Company } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface CompanySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company | null;
}

export function CompanySheet({ open, onOpenChange, company }: CompanySheetProps) {
    const isEdit = company !== null;
    const createCompany = useCreateCompany();
    const updateCompany = useUpdateCompany();
    const processing = createCompany.isPending || updateCompany.isPending;

    const [name, setName] = useState('');
    const [legalName, setLegalName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [defaultCurrency, setDefaultCurrency] = useState('');
    const [timezone, setTimezone] = useState('UTC');
    const [status, setStatus] = useState('active');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setName(company?.name ?? '');
            setLegalName(company?.legal_name ?? '');
            setTaxId(company?.tax_id ?? '');
            setEmail(company?.email ?? '');
            setPhone(company?.phone ?? '');
            setAddress(company?.address ?? '');
            setLogoUrl(company?.logo_url ?? '');
            setDefaultCurrency(company?.default_currency ?? '');
            setTimezone(company?.timezone ?? 'UTC');
            setStatus(company?.status ?? 'active');
            setErrors({});
        }
    }, [open, company]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            name,
            legal_name: legalName,
            tax_id: taxId,
            email,
            phone,
            address,
            logo_url: logoUrl,
            default_currency: defaultCurrency,
            timezone,
            status,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Company updated.' : 'Company created.');
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
            updateCompany.mutate({ id: company.id, ...payload }, { onSuccess, onError });
        } else {
            createCompany.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit company' : 'New company'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the company details below.' : 'Create a company for your organization.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="company-name">Name</Label>
                        <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="company-legal-name">Legal name</Label>
                        <Input id="company-legal-name" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
                        <InputError message={errors.legal_name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="company-tax-id">Tax ID</Label>
                        <Input id="company-tax-id" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                        <InputError message={errors.tax_id?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="company-email">Email</Label>
                        <Input id="company-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <InputError message={errors.email?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="company-phone">Phone</Label>
                        <Input id="company-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        <InputError message={errors.phone?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="company-address">Address</Label>
                        <Textarea id="company-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                        <InputError message={errors.address?.[0]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="company-currency">Default currency</Label>
                            <Input id="company-currency" value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} placeholder="e.g. USD" />
                            <InputError message={errors.default_currency?.[0]} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="company-timezone">Timezone</Label>
                            <Input id="company-timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="e.g. UTC" />
                            <InputError message={errors.timezone?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="company-logo">Logo URL</Label>
                        <Input id="company-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
                        <InputError message={errors.logo_url?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="company-status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="company-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.[0]} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create company'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
