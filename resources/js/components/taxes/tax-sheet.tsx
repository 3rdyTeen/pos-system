import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useCreateTax, useUpdateTax } from '@/hooks/taxes/useTaxMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Tax } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface TaxSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tax: Tax | null;
}

export function TaxSheet({ open, onOpenChange, tax }: TaxSheetProps) {
    const isEdit = tax !== null;
    const { data: companies = [] } = useCompanyOptions();
    const createTax = useCreateTax();
    const updateTax = useUpdateTax();
    const processing = createTax.isPending || updateTax.isPending;

    const [companyId, setCompanyId] = useState('');
    const [name, setName] = useState('');
    const [rate, setRate] = useState('0');
    const [type, setType] = useState('both');
    const [isInclusive, setIsInclusive] = useState(false);
    const [status, setStatus] = useState('active');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setCompanyId(tax?.company_id ?? '');
            setName(tax?.name ?? '');
            setRate(tax?.rate ?? '0');
            setType(tax?.type ?? 'both');
            setIsInclusive(tax?.is_inclusive ?? false);
            setStatus(tax?.status ?? 'active');
            setErrors({});
        }
    }, [open, tax]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            company_id: companyId,
            name,
            rate,
            type,
            is_inclusive: isInclusive,
            status,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Tax updated.' : 'Tax created.');
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
            updateTax.mutate({ id: tax.id, ...payload }, { onSuccess, onError });
        } else {
            createTax.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit tax' : 'New tax'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the tax details below.' : 'Add a tax for a company.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="tax-company">Company</Label>
                        <Select value={companyId || undefined} onValueChange={setCompanyId}>
                            <SelectTrigger id="tax-company">
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
                        <Label htmlFor="tax-name">Name</Label>
                        <Input id="tax-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VAT" autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="tax-rate">Rate (%)</Label>
                        <Input id="tax-rate" type="number" step="0.001" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
                        <InputError message={errors.rate?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="tax-type">Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger id="tax-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="purchase">Purchase</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type?.[0]} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="tax-inclusive">Inclusive</Label>
                            <p className="text-muted-foreground text-sm">Price already includes this tax.</p>
                        </div>
                        <Switch id="tax-inclusive" checked={isInclusive} onCheckedChange={setIsInclusive} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="tax-status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="tax-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.[0]} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create tax'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
