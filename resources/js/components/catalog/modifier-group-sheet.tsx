import InputError from '@/components/input-error';
import { money } from '@/components/pos/cart-summary';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useModifierGroup, useCreateModifierGroup, useUpdateModifierGroup } from '@/hooks/modifierGroups/useModifierGroups';
import { useProductOptions } from '@/hooks/products/useProductOptions';
import { ApiError, ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { ModifierGroup, ModifierOptionDraft, ModifierSelectionType } from '@/types';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: ModifierGroup | null;
}

const NO_PRODUCT = 'none';

function emptyOption(): ModifierOptionDraft {
    return { key: uid(), id: null, name: '', price_delta: '0', product_id: null, is_default: false };
}

/**
 * Builds a reusable set of choices — "Add-ons", "Size", "Sugar level" — and says
 * which products offer it.
 */
export function ModifierGroupSheet({ open, onOpenChange, group }: Props) {
    const [companyId, setCompanyId] = useState('');
    const [name, setName] = useState('');
    const [selectionType, setSelectionType] = useState<ModifierSelectionType>('single');
    const [isRequired, setIsRequired] = useState(false);
    const [minSelect, setMinSelect] = useState('0');
    const [maxSelect, setMaxSelect] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    const [options, setOptions] = useState<ModifierOptionDraft[]>([emptyOption()]);
    const [productIds, setProductIds] = useState<string[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const { data: companies } = useCompanyOptions();
    const { data: products } = useProductOptions();
    // The list row carries no options, so the full group is fetched to edit it.
    const { data: loaded } = useModifierGroup(open && group ? group.id : '');
    const createGroup = useCreateModifierGroup();
    const updateGroup = useUpdateModifierGroup();

    useEffect(() => {
        if (!open) {
            return;
        }

        setErrors({});
        setCompanyId(group?.company_id ?? '');
        setName(group?.name ?? '');
        setSelectionType(group?.selection_type ?? 'single');
        setIsRequired(group?.is_required ?? false);
        setMinSelect(String(group?.min_select ?? 0));
        setMaxSelect(group?.max_select === null || group?.max_select === undefined ? '' : String(group.max_select));
        setStatus(group?.status ?? 'active');

        if (!group) {
            setOptions([emptyOption()]);
            setProductIds([]);
        }
    }, [open, group]);

    // Hydrate the options once the full group arrives.
    useEffect(() => {
        if (!open || !loaded) {
            return;
        }

        setOptions(
            (loaded.options ?? []).map((option) => ({
                key: uid(),
                id: option.id,
                name: option.name,
                price_delta: option.price_delta,
                product_id: option.product_id,
                is_default: option.is_default,
            })),
        );
        setProductIds(loaded.product_ids ?? []);
    }, [open, loaded]);

    const patch = (key: string, next: Partial<ModifierOptionDraft>) =>
        setOptions((prev) => prev.map((option) => (option.key === key ? { ...option, ...next } : option)));

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            company_id: companyId,
            name,
            selection_type: selectionType,
            is_required: isRequired,
            min_select: Number(minSelect || 0),
            max_select: maxSelect === '' ? null : Number(maxSelect),
            status,
            options: options.map((option) => ({
                id: option.id,
                name: option.name,
                price_delta: option.price_delta || '0',
                product_id: option.product_id,
                is_default: option.is_default,
            })),
            product_ids: productIds,
        };

        const onSuccess = () => {
            toast.success(group ? 'Group updated.' : 'Group created.');
            onOpenChange(false);
        };

        const onError = (error: Error) => {
            if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
                setErrors(error.errors);

                return;
            }

            toast.error(error.message || 'Something went wrong.');
        };

        if (group) {
            updateGroup.mutate({ id: group.id, ...payload }, { onSuccess, onError });

            return;
        }

        createGroup.mutate(payload, { onSuccess, onError });
    };

    const isPending = createGroup.isPending || updateGroup.isPending;
    const single = selectionType === 'single';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>{group ? 'Edit group' : 'New group'}</SheetTitle>
                    <SheetDescription>A set of choices offered against a product at the till.</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="group-company">Company</Label>
                        <Select value={companyId} onValueChange={setCompanyId} disabled={group !== null}>
                            <SelectTrigger id="group-company">
                                <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                            <SelectContent>
                                {(companies ?? []).map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                        {company.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.company_id?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="group-name">Name</Label>
                        <Input id="group-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Add-ons" />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="group-type">How many can be chosen</Label>
                        <Select value={selectionType} onValueChange={(value) => setSelectionType(value as ModifierSelectionType)}>
                            <SelectTrigger id="group-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">One — like a size</SelectItem>
                                <SelectItem value="multiple">Any number — like add-ons</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.selection_type?.[0]} />
                    </div>

                    <label className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm">
                        <span>
                            Required
                            <span className="block text-xs text-muted-foreground">
                                {single
                                    ? 'The cashier must pick exactly one before the item can be added.'
                                    : 'The cashier must pick at least the minimum below.'}
                            </span>
                        </span>
                        <Switch checked={isRequired} onCheckedChange={setIsRequired} />
                    </label>

                    {/* Bounds only mean anything for a multi-choice group; a single one is
                        always at most one, and exactly one when required. */}
                    {!single && (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-2">
                                <Label htmlFor="group-min">Minimum</Label>
                                <Input id="group-min" type="number" min="0" value={minSelect} onChange={(event) => setMinSelect(event.target.value)} />
                                <InputError message={errors.min_select?.[0]} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="group-max">Maximum</Label>
                                <Input
                                    id="group-max"
                                    type="number"
                                    min="1"
                                    value={maxSelect}
                                    onChange={(event) => setMaxSelect(event.target.value)}
                                    placeholder="No limit"
                                />
                                <InputError message={errors.max_select?.[0]} />
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button type="button" size="sm" variant="outline" onClick={() => setOptions((prev) => [...prev, emptyOption()])}>
                                Add option
                            </Button>
                        </div>

                        <div className="grid gap-2 rounded-md border p-3">
                            {options.map((option, index) => (
                                <div key={option.key} className="grid gap-1">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={option.name}
                                            onChange={(event) => patch(option.key, { name: event.target.value })}
                                            placeholder="Extra cheese"
                                            className="h-9 flex-1"
                                            aria-label={`Option ${index + 1} name`}
                                        />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={option.price_delta}
                                            onChange={(event) => patch(option.key, { price_delta: event.target.value })}
                                            className="h-9 w-24 tabular-nums"
                                            aria-label={`Option ${index + 1} price change`}
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setOptions((prev) => prev.filter((o) => o.key !== option.key))}
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                            aria-label={`Remove option ${index + 1}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2 pl-1">
                                        {/* Linking a product is what turns a price into a stock movement. */}
                                        <Select
                                            value={option.product_id ?? NO_PRODUCT}
                                            onValueChange={(value) => patch(option.key, { product_id: value === NO_PRODUCT ? null : value })}
                                        >
                                            <SelectTrigger className="h-8 flex-1 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NO_PRODUCT}>Deducts no stock</SelectItem>
                                                {(products ?? []).map((product) => (
                                                    <SelectItem key={product.id} value={product.id}>
                                                        Deducts {product.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Checkbox
                                                checked={option.is_default}
                                                onCheckedChange={(checked) => patch(option.key, { is_default: checked === true })}
                                            />
                                            Default
                                        </label>
                                    </div>

                                    <InputError message={errors[`options.${index}.name`]?.[0] ?? errors[`options.${index}.price_delta`]?.[0]} />
                                </div>
                            ))}
                        </div>
                        <InputError message={errors.options?.[0]} />
                        <p className="text-xs text-muted-foreground">
                            A price change can be negative — &ldquo;No cheese&rdquo; at {money(-5)} is as valid as &ldquo;Large&rdquo; at +{money(25)}.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label>Products offering this group</Label>
                        <div className="grid max-h-52 gap-1 overflow-y-auto rounded-md border p-3">
                            {(products ?? []).length === 0 && <p className="text-xs text-muted-foreground">No products yet.</p>}
                            {(products ?? []).map((product) => (
                                <label key={product.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={productIds.includes(product.id)}
                                        onCheckedChange={(checked) =>
                                            setProductIds((prev) =>
                                                checked === true ? [...prev, product.id] : prev.filter((id) => id !== product.id),
                                            )
                                        }
                                    />
                                    {product.name}
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.product_ids?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="group-status">Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'inactive')}>
                            <SelectTrigger id="group-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.[0]} />
                    </div>
                </form>

                <SheetFooter className="mt-auto gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={submit} disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save group'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
