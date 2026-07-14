import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useCreatePaymentMethod, useUpdatePaymentMethod } from '@/hooks/paymentMethods/usePaymentMethodMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { PaymentMethod } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface PaymentMethodSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paymentMethod: PaymentMethod | null;
}

export function PaymentMethodSheet({ open, onOpenChange, paymentMethod }: PaymentMethodSheetProps) {
    const isEdit = paymentMethod !== null;
    const { data: companies = [] } = useCompanyOptions();
    const createPaymentMethod = useCreatePaymentMethod();
    const updatePaymentMethod = useUpdatePaymentMethod();
    const processing = createPaymentMethod.isPending || updatePaymentMethod.isPending;

    const [companyId, setCompanyId] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setCompanyId(paymentMethod?.company_id ?? '');
            setName(paymentMethod?.name ?? '');
            setType(paymentMethod?.type ?? '');
            setIsActive(paymentMethod?.is_active ?? true);
            setErrors({});
        }
    }, [open, paymentMethod]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            company_id: companyId,
            name,
            type,
            is_active: isActive,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Payment method updated.' : 'Payment method created.');
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
            updatePaymentMethod.mutate({ id: paymentMethod.id, ...payload }, { onSuccess, onError });
        } else {
            createPaymentMethod.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit payment method' : 'New payment method'}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? 'Update the payment method details below.' : 'Add a payment method for a company.'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="payment-method-company">Company</Label>
                        <Select value={companyId || undefined} onValueChange={setCompanyId}>
                            <SelectTrigger id="payment-method-company">
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
                        <Label htmlFor="payment-method-name">Name</Label>
                        <Input id="payment-method-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cash" autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="payment-method-type">Type</Label>
                        <Input id="payment-method-type" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. cash, card" />
                        <InputError message={errors.type?.[0]} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="payment-method-active">Active</Label>
                            <p className="text-muted-foreground text-sm">Available for use at checkout.</p>
                        </div>
                        <Switch id="payment-method-active" checked={isActive} onCheckedChange={setIsActive} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create payment method'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
