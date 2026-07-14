import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCreateCurrency, useUpdateCurrency } from '@/hooks/currencies/useCurrencyMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Currency } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface CurrencySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currency: Currency | null;
}

export function CurrencySheet({ open, onOpenChange, currency }: CurrencySheetProps) {
    const isEdit = currency !== null;
    const createCurrency = useCreateCurrency();
    const updateCurrency = useUpdateCurrency();
    const processing = createCurrency.isPending || updateCurrency.isPending;

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [exchangeRate, setExchangeRate] = useState('1');
    const [isBase, setIsBase] = useState(false);
    const [status, setStatus] = useState('active');
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setCode(currency?.code ?? '');
            setName(currency?.name ?? '');
            setSymbol(currency?.symbol ?? '');
            setExchangeRate(currency?.exchange_rate ?? '1');
            setIsBase(currency?.is_base ?? false);
            setStatus(currency?.status ?? 'active');
            setErrors({});
        }
    }, [open, currency]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            code,
            name,
            symbol,
            exchange_rate: exchangeRate,
            is_base: isBase,
            status,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Currency updated.' : 'Currency created.');
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
            updateCurrency.mutate({ id: currency.id, ...payload }, { onSuccess, onError });
        } else {
            createCurrency.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit currency' : 'New currency'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the currency details below.' : 'Add a currency to the system.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="currency-code">Code</Label>
                        <Input id="currency-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. USD" autoFocus />
                        <InputError message={errors.code?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="currency-name">Name</Label>
                        <Input id="currency-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. US Dollar" />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="currency-symbol">Symbol</Label>
                        <Input id="currency-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g. $" />
                        <InputError message={errors.symbol?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="currency-rate">Exchange rate</Label>
                        <Input
                            id="currency-rate"
                            type="number"
                            step="0.000001"
                            min="0"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value)}
                        />
                        <InputError message={errors.exchange_rate?.[0]} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="currency-base">Base currency</Label>
                            <p className="text-muted-foreground text-sm">Use this as the reference currency.</p>
                        </div>
                        <Switch id="currency-base" checked={isBase} onCheckedChange={setIsBase} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="currency-status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="currency-status">
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
                            {isEdit ? 'Save changes' : 'Create currency'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
