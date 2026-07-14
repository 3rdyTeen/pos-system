import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useProductCategoryOptions } from '@/hooks/productCategories/useProductCategories';
import { useCreateProduct, useUpdateProduct } from '@/hooks/products/useProductMutations';
import { useTaxOptions } from '@/hooks/taxes/useTaxes';
import { useUnitOptions } from '@/hooks/units/useUnits';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Product } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface ProductSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
}

const NONE_VALUE = 'none';

export function ProductSheet({ open, onOpenChange, product }: ProductSheetProps) {
    const isEdit = product !== null;
    const { data: companies = [] } = useCompanyOptions();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const processing = createProduct.isPending || updateProduct.isPending;

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

    // Category / unit / tax choices are scoped to the selected company.
    const { data: categories = [] } = useProductCategoryOptions(companyId || undefined);
    const { data: units = [] } = useUnitOptions(companyId || undefined);
    const { data: taxes = [] } = useTaxOptions(companyId || undefined);

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
        }
    }, [open, product]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
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
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Product updated.' : 'Product created.');
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
            updateProduct.mutate({ id: product.id, ...payload }, { onSuccess, onError });
        } else {
            createProduct.mutate(payload, { onSuccess, onError });
        }
    };

    const resetCompanyScoped = (value: string) => {
        setCompanyId(value);
        setCategoryId('');
        setBaseUnitId('');
        setTaxId('');
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit product' : 'New product'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the product details below.' : 'Add a product to the catalog.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
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
                        <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coca-Cola 1.5L" autoFocus />
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
                            <Input id="product-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Coca-Cola" />
                            <InputError message={errors.brand?.[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="product-category">Category</Label>
                        <Select value={categoryId || NONE_VALUE} onValueChange={(value) => setCategoryId(value === NONE_VALUE ? '' : value)}>
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
                            <Select value={baseUnitId || NONE_VALUE} onValueChange={(value) => setBaseUnitId(value === NONE_VALUE ? '' : value)}>
                                <SelectTrigger id="product-unit">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                                    {units.map((option) => (
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
                            <Input id="product-cost" type="number" step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
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

                    <SheetFooter className="mt-auto gap-2">
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
