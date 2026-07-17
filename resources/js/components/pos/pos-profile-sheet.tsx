import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useCreatePosProfile, useUpdatePosProfile } from '@/hooks/posProfiles/usePosProfiles';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { OrderType, PickingMode, PosProfile } from '@/types';
import { useEffect, useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: PosProfile | null;
}

const ORDER_TYPES: { value: OrderType; label: string; hint: string }[] = [
    { value: 'retail', label: 'Retail', hint: 'A plain counter sale' },
    { value: 'dine_in', label: 'Dine in', hint: 'Table service' },
    { value: 'takeout', label: 'Takeout', hint: 'Counter, taken away' },
    { value: 'delivery', label: 'Delivery', hint: 'Sent out' },
];

const PICKING_MODES: { value: PickingMode; label: string; hint: string }[] = [
    { value: 'barcode', label: 'Barcode', hint: 'Scanner only — a grocery lane' },
    { value: 'tiles', label: 'Tiles', hint: 'Touch grid only — a fast-food counter' },
    { value: 'hybrid', label: 'Both', hint: 'Scanner and tiles side by side' },
];

/**
 * The editor for a terminal's behaviour. This is where a grocery lane and a
 * fast-food counter are told apart — they are the same terminal with different
 * rows here.
 */
export function PosProfileSheet({ open, onOpenChange, profile }: Props) {
    const [companyId, setCompanyId] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [pickingMode, setPickingMode] = useState<PickingMode>('hybrid');
    const [orderTypes, setOrderTypes] = useState<OrderType[]>(['retail']);
    const [defaultOrderType, setDefaultOrderType] = useState<OrderType | ''>('retail');
    const [quickTender, setQuickTender] = useState('20, 50, 100, 200, 500, 1000');
    const [requireCustomer, setRequireCustomer] = useState(false);
    const [allowHeld, setAllowHeld] = useState(true);
    const [allowNegative, setAllowNegative] = useState(true);
    const [isDefault, setIsDefault] = useState(false);
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    const [errors, setErrors] = useState<ValidationErrors>({});

    const { data: companies } = useCompanyOptions();
    const createProfile = useCreatePosProfile();
    const updateProfile = useUpdatePosProfile();

    useEffect(() => {
        if (!open) {
            return;
        }

        setErrors({});
        setCompanyId(profile?.company_id ?? '');
        setName(profile?.name ?? '');
        setCode(profile?.code ?? '');
        setPickingMode(profile?.picking_mode ?? 'hybrid');
        setOrderTypes(profile?.order_types ?? ['retail']);
        setDefaultOrderType(profile?.default_order_type ?? 'retail');
        setQuickTender((profile?.quick_tender ?? [20, 50, 100, 200, 500, 1000]).join(', '));
        setRequireCustomer(profile?.require_customer ?? false);
        setAllowHeld(profile?.allow_held_orders ?? true);
        setAllowNegative(profile?.allow_negative_stock ?? true);
        setIsDefault(profile?.is_default ?? false);
        setStatus(profile?.status ?? 'active');
    }, [open, profile]);

    const toggleOrderType = (type: OrderType, checked: boolean) => {
        setOrderTypes((prev) => {
            const next = checked ? [...prev, type] : prev.filter((t) => t !== type);

            // The default has to stay one of the allowed types, or the terminal would
            // boot into an order type it is not allowed to use.
            if (!checked && defaultOrderType === type) {
                setDefaultOrderType(next[0] ?? '');
            }

            return next;
        });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            company_id: companyId,
            name,
            code: code || null,
            picking_mode: pickingMode,
            order_types: orderTypes,
            default_order_type: defaultOrderType || null,
            quick_tender: quickTender
                .split(',')
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isFinite(value) && value > 0),
            require_customer: requireCustomer,
            allow_held_orders: allowHeld,
            allow_negative_stock: allowNegative,
            is_default: isDefault,
            status,
        };

        const onSuccess = () => {
            toast.success(profile ? 'Profile updated.' : 'Profile created.');
            onOpenChange(false);
        };

        const onError = (error: Error) => {
            if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
                setErrors(error.errors);

                return;
            }

            toast.error(error.message || 'Something went wrong.');
        };

        if (profile) {
            updateProfile.mutate({ id: profile.id, ...payload }, { onSuccess, onError });

            return;
        }

        createProfile.mutate(payload, { onSuccess, onError });
    };

    const isPending = createProfile.isPending || updateProfile.isPending;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>{profile ? 'Edit profile' : 'New profile'}</SheetTitle>
                    <SheetDescription>How a terminal running this profile behaves.</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="profile-company">Company</Label>
                        <Select value={companyId} onValueChange={setCompanyId} disabled={profile !== null}>
                            <SelectTrigger id="profile-company">
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
                        <Label htmlFor="profile-name">Name</Label>
                        <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Grocery lane" />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="profile-code">Code</Label>
                        <Input id="profile-code" value={code} onChange={(event) => setCode(event.target.value)} />
                        <InputError message={errors.code?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="profile-picking">How the cashier finds a product</Label>
                        <Select value={pickingMode} onValueChange={(value) => setPickingMode(value as PickingMode)}>
                            <SelectTrigger id="profile-picking">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PICKING_MODES.map((mode) => (
                                    <SelectItem key={mode.value} value={mode.value}>
                                        {mode.label} — {mode.hint}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.picking_mode?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Order types</Label>
                        <div className="grid gap-2 rounded-md border p-3">
                            {ORDER_TYPES.map((type) => (
                                <label key={type.value} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={orderTypes.includes(type.value)}
                                        onCheckedChange={(checked) => toggleOrderType(type.value, checked === true)}
                                    />
                                    <span>{type.label}</span>
                                    <span className="text-xs text-muted-foreground">{type.hint}</span>
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.order_types?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="profile-default-type">Default order type</Label>
                        <Select value={defaultOrderType} onValueChange={(value) => setDefaultOrderType(value as OrderType)}>
                            <SelectTrigger id="profile-default-type">
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_TYPES.filter((type) => orderTypes.includes(type.value)).map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.default_order_type?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="profile-tender">Quick tender buttons</Label>
                        <Input
                            id="profile-tender"
                            value={quickTender}
                            onChange={(event) => setQuickTender(event.target.value)}
                            placeholder="20, 50, 100"
                        />
                        <p className="text-xs text-muted-foreground">Cash denominations offered as one-tap buttons, comma separated.</p>
                        <InputError message={errors.quick_tender?.[0]} />
                    </div>

                    <div className="grid gap-3 rounded-md border p-3">
                        <label className="flex items-center justify-between gap-4 text-sm">
                            <span>
                                Allow held orders
                                <span className="block text-xs text-muted-foreground">Park a cart and come back to it.</span>
                            </span>
                            <Switch checked={allowHeld} onCheckedChange={setAllowHeld} />
                        </label>

                        <label className="flex items-center justify-between gap-4 text-sm">
                            <span>
                                Sell past zero stock
                                <span className="block text-xs text-muted-foreground">
                                    Off means the till refuses to oversell. Groceries usually leave this on because counts drift.
                                </span>
                            </span>
                            <Switch checked={allowNegative} onCheckedChange={setAllowNegative} />
                        </label>

                        <label className="flex items-center justify-between gap-4 text-sm">
                            <span>
                                Require a customer
                                <span className="block text-xs text-muted-foreground">Every sale must be attached to someone.</span>
                            </span>
                            <Switch checked={requireCustomer} onCheckedChange={setRequireCustomer} />
                        </label>

                        <label className="flex items-center justify-between gap-4 text-sm">
                            <span>
                                Company default
                                <span className="block text-xs text-muted-foreground">
                                    Used by any register that has no profile of its own.
                                </span>
                            </span>
                            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                        </label>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="profile-status">Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'inactive')}>
                            <SelectTrigger id="profile-status">
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
                        {isPending ? 'Saving...' : 'Save profile'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
