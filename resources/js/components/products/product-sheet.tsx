import InputError from '@/components/input-error';
import { ProductSheetBarcodesTab } from '@/components/products/product-sheet-barcodes-tab';
import { ProductSheetUnitsTab } from '@/components/products/product-sheet-units-tab';
import { ProductSheetVariantsTab } from '@/components/products/product-sheet-variants-tab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useProductCategoryOptions } from '@/hooks/productCategories/useProductCategories';
import { useProductBarcodes } from '@/hooks/products/useProductBarcodes';
import { useProductUnits } from '@/hooks/products/useProductUnits';
import { useProductVariants } from '@/hooks/products/useProductVariants';
import { ChildScope, SaveProductError, SaveProductProgress, useSaveProduct } from '@/hooks/products/useSaveProduct';
import { useTaxOptions } from '@/hooks/taxes/useTaxes';
import { useUnitOptions } from '@/hooks/units/useUnits';
import { ValidationErrors } from '@/lib/api';
import { uid } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { AttributeRow, BarcodeDraft, DraftRow, Product, RemovedIds, UnitDraft, VariantDraft } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface ProductSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
}

const NONE_VALUE = 'none';

const noRemovals = (): RemovedIds => ({ variants: [], units: [], barcodes: [] });
const noRowErrors = (): Record<ChildScope, Record<string, ValidationErrors>> => ({ variants: {}, units: {}, barcodes: {} });

const toAttributeRows = (attributes: Record<string, string> | undefined): AttributeRow[] =>
    Object.entries(attributes ?? {}).map(([key, value]) => ({ key, value: String(value) }));

export function ProductSheet({ open, onOpenChange, product }: ProductSheetProps) {
    const isEdit = product !== null;
    const { data: companies = [] } = useCompanyOptions();
    const saveProduct = useSaveProduct();
    const processing = saveProduct.isPending;

    const [companyId, setCompanyId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [description, setDescription] = useState('');
    const [brand, setBrand] = useState('');
    const [baseUnitId, setBaseUnitId] = useState('');
    const [taxId, setTaxId] = useState('');
    const [costPrice, setCostPrice] = useState('0');
    const [sellingPrice, setSellingPrice] = useState('0');
    const [reorderLevel, setReorderLevel] = useState('0');
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const [variants, setVariants] = useState<VariantDraft[]>([]);
    const [units, setUnits] = useState<UnitDraft[]>([]);
    const [barcodes, setBarcodes] = useState<BarcodeDraft[]>([]);
    const [removed, setRemoved] = useState<RemovedIds>(noRemovals);
    const [rowErrors, setRowErrors] = useState(noRowErrors);

    const [activeTab, setActiveTab] = useState('details');
    const [hydrated, setHydrated] = useState(false);
    /**
     * Set once the product exists on the server. In create mode a save that fails
     * part way through still leaves the product behind, so retrying must update
     * that product rather than create a second one.
     */
    const [savedProductId, setSavedProductId] = useState<string | null>(null);

    // Category / unit / tax choices are scoped to the selected company.
    const { data: categories = [] } = useProductCategoryOptions(companyId || undefined);
    const { data: unitOptions = [] } = useUnitOptions(companyId || undefined);
    const { data: taxes = [] } = useTaxOptions(companyId || undefined);

    // Only fetch children when editing; these queries are disabled for an empty id.
    const variantsQuery = useProductVariants(product?.id ?? '');
    const unitsQuery = useProductUnits(product?.id ?? '');
    const barcodesQuery = useProductBarcodes(product?.id ?? '');

    const childrenFailed = isEdit && (variantsQuery.isError || unitsQuery.isError || barcodesQuery.isError);
    const childrenLoaded = !isEdit || (variantsQuery.isSuccess && unitsQuery.isSuccess && barcodesQuery.isSuccess);

    useEffect(() => {
        if (open) {
            setCompanyId(product?.company_id ?? '');
            setCategoryId(product?.category_id ?? '');
            setName(product?.name ?? '');
            setSku(product?.sku ?? '');
            setDescription(product?.description ?? '');
            setBrand(product?.brand ?? '');
            setBaseUnitId(product?.base_unit_id ?? '');
            setTaxId(product?.tax_id ?? '');
            setCostPrice(product?.cost_price ?? '0');
            setSellingPrice(product?.selling_price ?? '0');
            setReorderLevel(product?.reorder_level ?? '0');
            setIsActive(product?.is_active ?? true);
            setErrors({});

            setVariants([]);
            setUnits([]);
            setBarcodes([]);
            setRemoved(noRemovals());
            setRowErrors(noRowErrors());
            setActiveTab('details');
            setHydrated(false);
            setSavedProductId(null);
        }
    }, [open, product]);

    // Hydrate the child drafts once per opening, after their queries land. Guarded by
    // `hydrated` so a background refetch never overwrites what the user has typed.
    useEffect(() => {
        if (!open || hydrated || !childrenLoaded) {
            return;
        }

        if (isEdit) {
            const variantRows: VariantDraft[] = (variantsQuery.data ?? []).map((variant) => ({
                key: uid(),
                id: variant.id,
                variant_name: variant.variant_name,
                sku: variant.sku ?? '',
                attributes: toAttributeRows(variant.attributes),
                cost_price: variant.cost_price,
                selling_price: variant.selling_price,
            }));

            const unitRows: UnitDraft[] = (unitsQuery.data ?? []).map((unit) => ({
                key: uid(),
                id: unit.id,
                unit_id: unit.unit_id,
                conversion_factor: unit.conversion_factor,
                is_base_unit: unit.is_base_unit,
            }));

            // Barcodes arrive holding server ids; map them back onto the draft keys.
            const barcodeRows: BarcodeDraft[] = (barcodesQuery.data ?? []).map((barcode) => ({
                key: uid(),
                id: barcode.id,
                barcode: barcode.barcode,
                variant_key: variantRows.find((row) => row.id === barcode.product_variant_id)?.key ?? null,
                unit_key: unitRows.find((row) => row.id === barcode.product_unit_id)?.key ?? null,
                is_primary: barcode.is_primary,
            }));

            setVariants(variantRows);
            setUnits(unitRows);
            setBarcodes(barcodeRows);
        }

        setHydrated(true);
    }, [open, hydrated, childrenLoaded, isEdit, variantsQuery.data, unitsQuery.data, barcodesQuery.data]);

    const forget = (scope: ChildScope, row: DraftRow) => {
        if (row.id) {
            setRemoved((prev) => ({ ...prev, [scope]: [...prev[scope], row.id as string] }));
        }
    };

    const removeVariant = (row: VariantDraft) => {
        setVariants((prev) => prev.filter((candidate) => candidate.key !== row.key));
        setBarcodes((prev) => prev.map((barcode) => (barcode.variant_key === row.key ? { ...barcode, variant_key: null } : barcode)));
        forget('variants', row);
    };

    const removeUnit = (row: UnitDraft) => {
        setUnits((prev) => prev.filter((candidate) => candidate.key !== row.key));
        setBarcodes((prev) => prev.map((barcode) => (barcode.unit_key === row.key ? { ...barcode, unit_key: null } : barcode)));
        forget('units', row);
    };

    const removeBarcode = (row: BarcodeDraft) => {
        setBarcodes((prev) => prev.filter((candidate) => candidate.key !== row.key));
        forget('barcodes', row);
    };

    const resetCompanyScoped = (value: string) => {
        if (value === companyId) {
            return;
        }

        setCompanyId(value);
        setCategoryId('');
        setBaseUnitId('');
        setTaxId('');

        // Unit options are company-scoped, so any unit already picked is now invalid.
        setRemoved((prev) => ({ ...prev, units: [...prev.units, ...units.filter((row) => row.id).map((row) => row.id as string)] }));
        setUnits([]);
        setBarcodes((prev) => prev.map((barcode) => ({ ...barcode, unit_key: null })));
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});
        setRowErrors(noRowErrors());

        const progress: SaveProductProgress = {
            productSaved: (id) => setSavedProductId(id),
            // Record ids as they land so a retry updates these rows instead of duplicating them.
            rowSaved: (scope, key, id) => {
                const withId = <T extends DraftRow>(rows: T[]): T[] => rows.map((row) => (row.key === key ? { ...row, id } : row));

                if (scope === 'variants') {
                    setVariants(withId);
                } else if (scope === 'units') {
                    setUnits(withId);
                } else {
                    setBarcodes(withId);
                }
            },
            rowRemoved: (scope, id) => setRemoved((prev) => ({ ...prev, [scope]: prev[scope].filter((candidate) => candidate !== id) })),
        };

        const input = {
            productId: product?.id ?? savedProductId,
            details: {
                company_id: companyId,
                category_id: categoryId || null,
                name,
                sku,
                description,
                brand,
                base_unit_id: baseUnitId || null,
                tax_id: taxId || null,
                cost_price: costPrice,
                selling_price: sellingPrice,
                reorder_level: reorderLevel,
                is_active: isActive,
            },
            variants,
            units,
            barcodes,
            removed,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Product updated.' : 'Product created.');
            onOpenChange(false);
        };

        const onError = (error: Error) => {
            if (!(error instanceof SaveProductError)) {
                toast.error(error.message || 'Something went wrong.');
                return;
            }

            setActiveTab(error.scope);

            const hasFieldErrors = Object.keys(error.errors).length > 0;
            const canShowInline = error.scope === 'details' || error.rowKey !== null;

            if (!hasFieldErrors || !canShowInline) {
                toast.error(error.message || 'Something went wrong.');
                return;
            }

            if (error.scope === 'details') {
                setErrors(error.errors);
            } else {
                const rowKey = error.rowKey as string;
                setRowErrors((prev) => ({ ...prev, [error.scope]: { [rowKey]: error.errors } }));
            }
        };

        saveProduct.mutate({ input, progress }, { onSuccess, onError });
    };

    const companySelected = companyId !== '';
    const childTabsDisabled = !companySelected || childrenFailed;

    const tabLabel = (label: string, count: number) => (
        <>
            {label}
            {count > 0 && <span className="text-muted-foreground text-xs">({count})</span>}
        </>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-3xl">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit product' : 'New product'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the product details below.' : 'Add a product to the catalog.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
                        <TabsList className="mt-4 grid w-full grid-cols-4">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="variants" disabled={childTabsDisabled}>
                                {tabLabel('Variants', variants.length)}
                            </TabsTrigger>
                            <TabsTrigger value="units" disabled={childTabsDisabled}>
                                {tabLabel('Units', units.length)}
                            </TabsTrigger>
                            <TabsTrigger value="barcodes" disabled={childTabsDisabled}>
                                {tabLabel('Barcodes', barcodes.length)}
                            </TabsTrigger>
                        </TabsList>

                        {!companySelected && (
                            <p className="text-muted-foreground mt-3 text-sm">Select a company to add variants, units, and barcodes.</p>
                        )}
                        {childrenFailed && (
                            <p className="text-destructive mt-3 text-sm">
                                Could not load this product's variants, units, and barcodes. Close and reopen to try again — saving now would leave
                                them unchanged.
                            </p>
                        )}

                        <div className="flex-1 overflow-y-auto py-6">
                            <TabsContent value="details" className="mt-0 grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="product-company">Company</Label>
                                    <Select value={companyId || undefined} onValueChange={resetCompanyScoped}>
                                        <SelectTrigger id="product-company">
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
                                    <Label htmlFor="product-name">Name</Label>
                                    <Input
                                        id="product-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Coca-Cola 1.5L"
                                        autoFocus
                                    />
                                    <InputError message={errors.name?.[0]} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="product-sku">SKU</Label>
                                        <Input id="product-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. COKE-15" />
                                        <InputError message={errors.sku?.[0]} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="product-brand">Brand</Label>
                                        <Input
                                            id="product-brand"
                                            value={brand}
                                            onChange={(e) => setBrand(e.target.value)}
                                            placeholder="e.g. Coca-Cola"
                                        />
                                        <InputError message={errors.brand?.[0]} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="product-category">Category</Label>
                                    <Select
                                        value={categoryId || NONE_VALUE}
                                        onValueChange={(value) => setCategoryId(value === NONE_VALUE ? '' : value)}
                                    >
                                        <SelectTrigger id="product-category">
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_VALUE}>None</SelectItem>
                                            {categories.map((option) => (
                                                <SelectItem key={option.id} value={option.id}>
                                                    {option.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category_id?.[0]} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="product-unit">Base unit</Label>
                                        <Select
                                            value={baseUnitId || NONE_VALUE}
                                            onValueChange={(value) => setBaseUnitId(value === NONE_VALUE ? '' : value)}
                                        >
                                            <SelectTrigger id="product-unit">
                                                <SelectValue placeholder="None" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                                {unitOptions.map((option) => (
                                                    <SelectItem key={option.id} value={option.id}>
                                                        {option.name} ({option.abbreviation})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.base_unit_id?.[0]} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="product-tax">Tax</Label>
                                        <Select value={taxId || NONE_VALUE} onValueChange={(value) => setTaxId(value === NONE_VALUE ? '' : value)}>
                                            <SelectTrigger id="product-tax">
                                                <SelectValue placeholder="None" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                                {taxes.map((option) => (
                                                    <SelectItem key={option.id} value={option.id}>
                                                        {option.name} ({option.rate}%)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.tax_id?.[0]} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="product-cost">Cost price</Label>
                                        <Input
                                            id="product-cost"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={costPrice}
                                            onChange={(e) => setCostPrice(e.target.value)}
                                        />
                                        <InputError message={errors.cost_price?.[0]} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="product-selling">Selling price</Label>
                                        <Input
                                            id="product-selling"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={sellingPrice}
                                            onChange={(e) => setSellingPrice(e.target.value)}
                                        />
                                        <InputError message={errors.selling_price?.[0]} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="product-reorder">Reorder level</Label>
                                        <Input
                                            id="product-reorder"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={reorderLevel}
                                            onChange={(e) => setReorderLevel(e.target.value)}
                                        />
                                        <InputError message={errors.reorder_level?.[0]} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="product-description">Description</Label>
                                    <Input id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                                    <InputError message={errors.description?.[0]} />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="product-active">Active</Label>
                                        <p className="text-muted-foreground text-sm">Available for sale.</p>
                                    </div>
                                    <Switch id="product-active" checked={isActive} onCheckedChange={setIsActive} />
                                </div>
                            </TabsContent>

                            <TabsContent value="variants" className="mt-0">
                                <ProductSheetVariantsTab
                                    rows={variants}
                                    onChange={setVariants}
                                    onRemove={removeVariant}
                                    rowErrors={rowErrors.variants}
                                />
                            </TabsContent>

                            <TabsContent value="units" className="mt-0">
                                <ProductSheetUnitsTab
                                    companyId={companyId}
                                    rows={units}
                                    onChange={setUnits}
                                    onRemove={removeUnit}
                                    rowErrors={rowErrors.units}
                                />
                            </TabsContent>

                            <TabsContent value="barcodes" className="mt-0">
                                <ProductSheetBarcodesTab
                                    companyId={companyId}
                                    rows={barcodes}
                                    variants={variants}
                                    units={units}
                                    onChange={setBarcodes}
                                    onRemove={removeBarcode}
                                    rowErrors={rowErrors.barcodes}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>

                    <SheetFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create product'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
