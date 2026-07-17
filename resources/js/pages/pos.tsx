import { CartLineRow } from '@/components/pos/cart-line-row';
import { cartTotals, money } from '@/components/pos/cart-summary';
import { ConfiguratorDialog } from '@/components/pos/configurator-dialog';
import { PaymentDialog } from '@/components/pos/payment-dialog';
import { ProductTile } from '@/components/pos/product-tile';
import { ShiftDialog } from '@/components/pos/shift-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerOptions } from '@/hooks/customers/useCustomers';
import { useBarcodeLookup, useCloseShift, useCurrentShift, useOpenShift, usePosContext, usePosProducts } from '@/hooks/pos/usePosTerminal';
import { useCreateSale, useDeleteSale, useHeldSales } from '@/hooks/sales/useSales';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { cn, uid } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { BreadcrumbItem, CartComponent, CartLine, CartModifier, PosProduct, SaleStatus } from '@/types';
import { Head } from '@inertiajs/react';
import { LockKeyhole, ScanLine, Search, Unlock } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sales', href: '/pos' },
    { title: 'Terminal', href: '/pos' },
];

const ORDER_TYPE_LABELS: Record<string, string> = {
    retail: 'Retail',
    dine_in: 'Dine in',
    takeout: 'Takeout',
    delivery: 'Delivery',
};

const WALK_IN = 'walk-in';

export default function Pos() {
    const [registerId, setRegisterId] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoryId, setCategoryId] = useState('all');
    const [lines, setLines] = useState<CartLine[]>([]);
    const [orderType, setOrderType] = useState('');
    const [customerId, setCustomerId] = useState(WALK_IN);
    const [scan, setScan] = useState('');
    const [paying, setPaying] = useState(false);
    const [shiftDialog, setShiftDialog] = useState<'open' | 'close' | null>(null);
    const [resumedFrom, setResumedFrom] = useState<string | null>(null);
    const [configuring, setConfiguring] = useState<PosProduct | null>(null);

    const scanRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const { data: context, isPending: contextPending } = usePosContext(registerId);
    const profile = context?.profile;
    const flags = context?.flags;
    const register = context?.register;
    const branchId = register?.branch_id ?? '';
    const warehouseId = context?.warehouse_id ?? undefined;

    const { data: shiftBody } = useCurrentShift(register?.id);
    const shift = shiftBody?.data ?? null;

    const { data: products, isPending: productsPending } = usePosProducts(debouncedSearch, categoryId, warehouseId);
    const { data: heldSales } = useHeldSales(register?.id);
    const { data: customers } = useCustomerOptions();

    const createSale = useCreateSale();
    const deleteSale = useDeleteSale();
    const openShift = useOpenShift();
    const closeShift = useCloseShift();
    const lookup = useBarcodeLookup();

    // Debounced so the grid does not refetch on every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);

        return () => clearTimeout(timer);
    }, [search]);

    // Adopt the profile's default order type once the terminal knows its config.
    useEffect(() => {
        if (profile && orderType === '') {
            setOrderType(profile.default_order_type);
        }
    }, [profile, orderType]);

    const totals = useMemo(() => cartTotals(lines), [lines]);
    const showTiles = profile?.picking_mode !== 'barcode';
    const showScanner = profile?.picking_mode !== 'tiles';

    /**
     * Put a product in the cart with the choices already made against it.
     *
     * A configured line is never merged into an existing one: a burger with cheese
     * and a burger without are different things, and stacking them would lose one
     * of the two answers.
     */
    const addLine = useCallback((product: PosProduct, modifiers: CartModifier[] = [], components: CartComponent[] = []) => {
        const configured = modifiers.length > 0 || components.length > 0;

        setLines((prev) => {
            // Scanning the same plain item twice bumps the quantity rather than
            // stacking duplicate rows, which is what a cashier expects at a grocery lane.
            const existing = configured
                ? undefined
                : prev.find(
                      (line) =>
                          line.product_id === product.id &&
                          line.product_variant_id === (product.product_variant_id ?? null) &&
                          line.modifiers.length === 0 &&
                          line.components.length === 0,
                  );

            if (existing) {
                return prev.map((line) =>
                    line.uid === existing.uid ? { ...line, quantity: String(Number(line.quantity) + 1) } : line,
                );
            }

            const deltas =
                modifiers.reduce((sum, m) => sum + Number(m.price_delta), 0) +
                components.reduce((sum, c) => sum + Number(c.price_delta), 0);

            return [
                ...prev,
                {
                    uid: uid(),
                    product_id: product.id,
                    product_variant_id: product.product_variant_id ?? null,
                    unit_id: product.unit_id,
                    name: product.variant_name ? `${product.name} (${product.variant_name})` : product.name,
                    quantity: '1',
                    // Preview only: the server reprices from the catalogue either way.
                    unit_price: (Number(product.unit_price) + deltas).toFixed(2),
                    discount_amount: '0',
                    tax_rate: product.tax_rate,
                    tax_inclusive: product.tax_inclusive,
                    // A combo has no stock of its own, so there is nothing to warn about.
                    stock_on_hand: product.is_combo ? null : product.stock_on_hand,
                    modifiers,
                    components,
                },
            ];
        });
    }, []);

    /**
     * Tapping a product either drops it straight in, or asks what the customer
     * wants first. The server tells us which, so the terminal never guesses.
     */
    const selectProduct = useCallback(
        (product: PosProduct) => {
            if (product.needs_configuration) {
                setConfiguring(product);

                return;
            }

            addLine(product);
        },
        [addLine],
    );

    const patchLine = (lineUid: string, patch: Partial<CartLine>) => {
        setLines((prev) => prev.map((line) => (line.uid === lineUid ? { ...line, ...patch } : line)));
    };

    const removeLine = (lineUid: string) => setLines((prev) => prev.filter((line) => line.uid !== lineUid));

    const clearCart = useCallback(() => {
        setLines([]);
        setResumedFrom(null);
        setCustomerId(WALK_IN);
        setOrderType(profile?.default_order_type ?? '');
    }, [profile]);

    const needsCustomer = Boolean(profile?.require_customer) && customerId === WALK_IN;
    const canSell = lines.length > 0 && branchId !== '' && !needsCustomer;

    const onScan = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!scan.trim()) {
            return;
        }

        const result = await lookup.mutateAsync({ barcode: scan.trim(), warehouseId }).catch((error: Error) => {
            toast.error(error instanceof ApiError && error.status === 404 ? 'No product matches that barcode.' : error.message);

            return null;
        });

        if (result) {
            // A scanned item still has to be configured if it has choices — the
            // barcode says which product, not which size.
            selectProduct(result.data);
        }

        setScan('');
        scanRef.current?.focus();
    };

    const payload = (status: SaleStatus) => ({
        branch_id: branchId,
        register_id: register?.id ?? null,
        shift_id: shift?.id ?? null,
        customer_id: customerId === WALK_IN ? null : customerId,
        order_type: orderType || null,
        status,
        notes: '',
        lines: lines.map((line) => ({
            product_id: line.product_id,
            product_variant_id: line.product_variant_id,
            unit_id: line.unit_id,
            quantity: line.quantity,
            // Omitted on a configured line: its displayed price is base + deltas, and
            // sending that back would look like a manual override of the catalogue.
            unit_price: line.modifiers.length > 0 || line.components.length > 0 ? undefined : line.unit_price,
            discount_amount: line.discount_amount || '0',
            modifiers: line.modifiers.map((modifier) => modifier.option_id),
            components: line.components.map((component) => ({ combo_slot_option_id: component.slot_option_id })),
        })),
    });

    const onError = (error: Error) => {
        if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
            // Line errors come back positionally, so name the item rather than the index.
            const [key, messages] = Object.entries(error.errors)[0];
            const index = Number(key.split('.')[1]);
            const name = Number.isInteger(index) ? lines[index]?.name : null;

            toast.error(name ? `${name}: ${messages[0]}` : messages[0]);

            return;
        }

        toast.error(error.message || 'Something went wrong.');
    };

    const hold = useCallback(() => {
        if (!canSell) {
            return;
        }

        createSale.mutate(payload('held'), {
            onSuccess: () => {
                toast.success('Sale held.');
                clearCart();
                scanRef.current?.focus();
            },
            onError,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canSell, lines, customerId, orderType, shift, register, branchId]);

    const takePayment = (payments: { payment_method_id: string; amount: string; reference_number: string | null }[]) => {
        createSale.mutate(
            { ...payload('completed'), payments },
            {
                onSuccess: (response) => {
                    toast.success(`${response.data.sale_number} completed.`);
                    setPaying(false);
                    // A resumed cart is re-rung as a new sale, so retire the parked one.
                    if (resumedFrom) {
                        deleteSale.mutate(resumedFrom);
                    }
                    clearCart();
                    scanRef.current?.focus();
                },
                onError,
            },
        );
    };

    const resume = (saleId: string) => {
        const sale = heldSales?.find((held) => held.id === saleId);

        if (!sale?.details) {
            return;
        }

        setLines(
            sale.details.map((detail) => ({
                uid: uid(),
                product_id: detail.product_id,
                product_variant_id: detail.product_variant_id,
                unit_id: detail.unit_id,
                name: detail.product?.name ?? 'Item',
                quantity: detail.quantity,
                unit_price: detail.unit_price,
                discount_amount: detail.discount_amount,
                tax_rate: null,
                tax_inclusive: false,
                stock_on_hand: null,
                // The choices are restored from what was parked, so resuming a meal
                // brings back the drink that was picked rather than the default.
                modifiers: (detail.modifiers ?? []).map((modifier) => ({
                    option_id: modifier.modifier_option_id ?? '',
                    group_id: modifier.modifier_group_id ?? '',
                    group_name: modifier.group_name ?? '',
                    name: modifier.name,
                    price_delta: modifier.price_delta,
                })),
                components: (detail.components ?? []).map((component) => ({
                    slot_option_id: component.slot_option_id ?? '',
                    slot_id: component.combo_slot_id ?? '',
                    slot_name: component.slot_name ?? '',
                    name: component.name,
                    price_delta: component.price_delta,
                })),
            })),
        );
        setOrderType(sale.order_type ?? profile?.default_order_type ?? '');
        setCustomerId(sale.customer_id ?? WALK_IN);
        setResumedFrom(sale.id);
    };

    /**
     * Till keyboard shortcuts. A cashier's hands are on a scanner and a keyboard,
     * not a mouse, and F-keys are the POS convention.
     */
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'F2') {
                event.preventDefault();
                if (canSell) {
                    setPaying(true);
                }
            } else if (event.key === 'F3') {
                event.preventDefault();
                if (profile?.allow_held_orders) {
                    hold();
                }
            } else if (event.key === 'F4') {
                event.preventDefault();
                (showScanner ? scanRef : searchRef).current?.focus();
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [canSell, hold, profile, showScanner]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="POS terminal" />

            {/* flex-1 + min-h-0 rather than a viewport calc: the layout's SidebarInset is
                a flex column, so the till fills whatever is left under the header and the
                two panes scroll inside it instead of the page scrolling. */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
                {/* Terminal bar: which till, who for, what kind of order, drawer state. */}
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={register?.id ?? ''} onValueChange={setRegisterId}>
                        <SelectTrigger className="h-10 w-40">
                            <SelectValue placeholder="Register" />
                        </SelectTrigger>
                        <SelectContent>
                            {(context?.registers ?? []).map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                    {r.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={customerId} onValueChange={setCustomerId}>
                        <SelectTrigger className={cn('h-10 w-44', needsCustomer && 'border-destructive text-destructive')}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {/* A profile can insist on knowing who the customer is. */}
                            {!profile?.require_customer && <SelectItem value={WALK_IN}>Walk-in</SelectItem>}
                            {(customers ?? []).map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                    {customer.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {profile && profile.order_types.length > 1 && (
                        <div className="flex gap-1 rounded-md border p-0.5">
                            {profile.order_types.map((type) => (
                                <Button
                                    key={type}
                                    type="button"
                                    size="sm"
                                    variant={orderType === type ? 'default' : 'ghost'}
                                    onClick={() => setOrderType(type)}
                                    className="h-9"
                                >
                                    {ORDER_TYPE_LABELS[type] ?? type}
                                </Button>
                            ))}
                        </div>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                        {profile && <Badge variant="outline">{profile.name}</Badge>}
                        {shift ? (
                            <Button size="sm" variant="outline" onClick={() => setShiftDialog('close')} className="h-10 gap-1.5">
                                <Unlock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                                Close drawer
                            </Button>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => setShiftDialog('open')} disabled={!register} className="h-10 gap-1.5">
                                <LockKeyhole className="h-3.5 w-3.5" />
                                Open drawer
                            </Button>
                        )}
                    </div>
                </div>

                {!contextPending && !register && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            No register is set up for your branch yet. Add one under Organization &rarr; Registers before selling.
                        </AlertDescription>
                    </Alert>
                )}

                {!contextPending && register && !warehouseId && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            {register.branch?.name ?? 'This branch'} has no active warehouse, so a sale has nothing to draw stock from.
                            Add one under Inventory &rarr; Warehouses.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_25rem]">
                    {/* Picking side: scanner, tiles, or both, per the profile. */}
                    <div className="flex min-h-0 flex-col gap-3">
                        {showScanner && (
                            <form onSubmit={onScan} className="relative">
                                <ScanLine className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={scanRef}
                                    value={scan}
                                    onChange={(event) => setScan(event.target.value)}
                                    placeholder="Scan a barcode"
                                    className="h-12 pl-10 text-base"
                                    autoFocus
                                />
                            </form>
                        )}

                        {showTiles && (
                            <>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        ref={searchRef}
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search products"
                                        className="h-10 pl-9"
                                    />
                                </div>

                                {/* Chips rather than a dropdown: one tap instead of two. */}
                                {(context?.categories.length ?? 0) > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={categoryId === 'all' ? 'default' : 'outline'}
                                            onClick={() => setCategoryId('all')}
                                            className="h-8"
                                        >
                                            All
                                        </Button>
                                        {context?.categories.map((category) => (
                                            <Button
                                                key={category.id}
                                                type="button"
                                                size="sm"
                                                variant={categoryId === category.id ? 'default' : 'outline'}
                                                onClick={() => setCategoryId(category.id)}
                                                className="h-8"
                                            >
                                                {category.name}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
                                    {productsPending
                                        ? Array.from({ length: 12 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-lg" />)
                                        : (products ?? []).map((product) => (
                                              <ProductTile
                                                  key={product.id}
                                                  product={product}
                                                  onSelect={() => selectProduct(product)}
                                                  showStock={flags?.show_stock ?? true}
                                              />
                                          ))}

                                    {!productsPending && (products ?? []).length === 0 && (
                                        <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
                                            No products match &ldquo;{debouncedSearch}&rdquo;.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Barcode-only tills have no grid, so the scanner owns the space. */}
                        {!showTiles && (
                            <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed">
                                <p className="text-sm text-muted-foreground">Scan items to build the sale.</p>
                            </div>
                        )}

                        {profile?.allow_held_orders && (heldSales?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 border-t pt-2">
                                <span className="text-xs text-muted-foreground">Held</span>
                                {heldSales?.map((held) => (
                                    <Button key={held.id} size="sm" variant="secondary" onClick={() => resume(held.id)} className="h-8">
                                        {held.sale_number}
                                        <span className="ml-1 text-muted-foreground">({held.details_count})</span>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart side. */}
                    <div className="flex min-h-0 flex-col rounded-lg border bg-card">
                        <div className="flex items-center justify-between border-b px-3 py-2">
                            <span className="text-sm font-medium">
                                Cart
                                {lines.length > 0 && <span className="ml-1.5 text-muted-foreground">{lines.length}</span>}
                            </span>
                            {resumedFrom && <Badge variant="secondary">Resumed</Badge>}
                        </div>

                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
                            {lines.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                                    <ScanLine className="h-8 w-8 text-muted-foreground/40" />
                                    <p className="text-sm text-muted-foreground">
                                        {showScanner ? 'Scan or tap an item to start.' : 'Tap an item to start.'}
                                    </p>
                                </div>
                            ) : (
                                lines.map((line) => (
                                    <CartLineRow
                                        key={line.uid}
                                        line={line}
                                        onPatch={(patch) => patchLine(line.uid, patch)}
                                        onRemove={() => removeLine(line.uid)}
                                        allowNegativeStock={profile?.allow_negative_stock ?? true}
                                        showStock={flags?.show_stock ?? true}
                                        allowPriceOverride={flags?.allow_price_override ?? true}
                                        allowLineDiscount={flags?.allow_line_discount ?? true}
                                    />
                                ))
                            )}
                        </div>

                        <div className="border-t p-3">
                            <div className="grid gap-1 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">{money(totals.subtotal)}</span>
                                </div>
                                {totals.discount > 0 && (
                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-500">
                                        <span>Discount</span>
                                        <span className="tabular-nums">-{money(totals.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tax</span>
                                    <span className="tabular-nums">{money(totals.tax)}</span>
                                </div>
                                <div className="mt-1 flex items-baseline justify-between border-t pt-2">
                                    <span className="font-medium">Total</span>
                                    <span className="text-3xl font-bold tabular-nums">{money(totals.grand)}</span>
                                </div>
                            </div>

                            {needsCustomer && lines.length > 0 && (
                                <p className="mt-2 text-xs text-destructive">This terminal requires a customer on every sale.</p>
                            )}

                            <div className="mt-3 grid gap-2">
                                <Button size="lg" className="h-14 text-base" disabled={!canSell || createSale.isPending} onClick={() => setPaying(true)}>
                                    Charge {money(totals.grand)}
                                    <kbd className="ml-2 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px]">F2</kbd>
                                </Button>
                                <div className="grid grid-cols-2 gap-2">
                                    {profile?.allow_held_orders && (
                                        <Button variant="outline" className="h-11" disabled={!canSell || createSale.isPending} onClick={hold}>
                                            Hold
                                            <kbd className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px]">F3</kbd>
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className={cn('h-11', !profile?.allow_held_orders && 'col-span-2')}
                                        disabled={lines.length === 0}
                                        onClick={clearCart}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfiguratorDialog
                product={configuring}
                onOpenChange={(open) => !open && setConfiguring(null)}
                onConfirm={(modifiers, components) => {
                    if (configuring) {
                        addLine(configuring, modifiers, components);
                    }

                    setConfiguring(null);
                    scanRef.current?.focus();
                }}
            />

            <PaymentDialog
                open={paying}
                onOpenChange={setPaying}
                total={totals.grand}
                context={context}
                isPending={createSale.isPending}
                onConfirm={takePayment}
                error={createSale.error}
            />

            <ShiftDialog
                open={shiftDialog !== null}
                onOpenChange={(open) => !open && setShiftDialog(null)}
                mode={shiftDialog ?? 'open'}
                reconciliation={shiftBody?.reconciliation ?? null}
                isPending={openShift.isPending || closeShift.isPending}
                error={openShift.error ?? closeShift.error}
                onConfirm={(balance, notes) => {
                    if (shiftDialog === 'open' && register) {
                        openShift.mutate(
                            { register_id: register.id, opening_balance: balance, notes },
                            {
                                onSuccess: () => {
                                    toast.success('Drawer opened.');
                                    setShiftDialog(null);
                                },
                            },
                        );

                        return;
                    }

                    if (shiftDialog === 'close' && shift) {
                        closeShift.mutate(
                            { id: shift.id, closing_balance: balance, notes },
                            {
                                onSuccess: (response) => {
                                    const variance = response.reconciliation?.variance ?? 0;
                                    toast.success(
                                        Math.abs(variance) < 0.005
                                            ? 'Drawer closed and balanced.'
                                            : `Drawer closed, ${money(Math.abs(variance))} ${variance < 0 ? 'short' : 'over'}.`,
                                    );
                                    setShiftDialog(null);
                                },
                            },
                        );
                    }
                }}
            />
        </AppLayout>
    );
}
