import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useCreateUnit, useUpdateUnit } from '@/hooks/units/useUnitMutations';
import { useUnitOptions } from '@/hooks/units/useUnits';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Unit } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface UnitSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unit: Unit | null;
}

const NONE_VALUE = 'none';

export function UnitSheet({ open, onOpenChange, unit }: UnitSheetProps) {
    const isEdit = unit !== null;
    const { data: companies = [] } = useCompanyOptions();
    const createUnit = useCreateUnit();
    const updateUnit = useUpdateUnit();
    const processing = createUnit.isPending || updateUnit.isPending;

    const [companyId, setCompanyId] = useState('');
    const [name, setName] = useState('');
    const [abbreviation, setAbbreviation] = useState('');
    const [baseUnitId, setBaseUnitId] = useState('');
    const [conversionFactor, setConversionFactor] = useState('1');
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Base units are scoped to the selected company; exclude the unit being edited.
    const { data: unitOptions = [] } = useUnitOptions(companyId || undefined);
    const baseUnitChoices = unitOptions.filter((option) => option.id !== unit?.id);

    useEffect(() => {
        if (open) {
            setCompanyId(unit?.company_id ?? '');
            setName(unit?.name ?? '');
            setAbbreviation(unit?.abbreviation ?? '');
            setBaseUnitId(unit?.base_unit_id ?? '');
            setConversionFactor(unit?.conversion_factor ?? '1');
            setErrors({});
        }
    }, [open, unit]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            company_id: companyId,
            name,
            abbreviation,
            base_unit_id: baseUnitId || null,
            conversion_factor: conversionFactor,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Unit updated.' : 'Unit created.');
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
            updateUnit.mutate({ id: unit.id, ...payload }, { onSuccess, onError });
        } else {
            createUnit.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit unit' : 'New unit'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the unit details below.' : 'Add a unit of measure for a company.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="unit-company">Company</Label>
                        <Select
                            value={companyId || undefined}
                            onValueChange={(value) => {
                                setCompanyId(value);
                                setBaseUnitId('');
                            }}
                        >
                            <SelectTrigger id="unit-company">
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
                        <Label htmlFor="unit-name">Name</Label>
                        <Input id="unit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kilogram" autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="unit-abbreviation">Abbreviation</Label>
                        <Input id="unit-abbreviation" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="e.g. kg" />
                        <InputError message={errors.abbreviation?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="unit-base">Base unit</Label>
                        <Select
                            value={baseUnitId || NONE_VALUE}
                            onValueChange={(value) => setBaseUnitId(value === NONE_VALUE ? '' : value)}
                        >
                            <SelectTrigger id="unit-base">
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                {baseUnitChoices.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.name} ({option.abbreviation})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.base_unit_id?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="unit-conversion">Conversion factor</Label>
                        <Input
                            id="unit-conversion"
                            type="number"
                            step="0.0001"
                            min="0"
                            value={conversionFactor}
                            onChange={(e) => setConversionFactor(e.target.value)}
                        />
                        <InputError message={errors.conversion_factor?.[0]} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create unit'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
