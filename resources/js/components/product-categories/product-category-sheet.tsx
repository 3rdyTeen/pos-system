import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCompanyOptions } from '@/hooks/companies/useCompanies';
import { useProductCategoryOptions } from '@/hooks/productCategories/useProductCategories';
import { useCreateProductCategory, useUpdateProductCategory } from '@/hooks/productCategories/useProductCategoryMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { ProductCategory } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface ProductCategorySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: ProductCategory | null;
}

const NONE_VALUE = 'none';

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

export function ProductCategorySheet({ open, onOpenChange, category }: ProductCategorySheetProps) {
    const isEdit = category !== null;
    const { data: companies = [] } = useCompanyOptions();
    const createCategory = useCreateProductCategory();
    const updateCategory = useUpdateProductCategory();
    const processing = createCategory.isPending || updateCategory.isPending;

    const [companyId, setCompanyId] = useState('');
    const [parentId, setParentId] = useState('');
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugTouched, setSlugTouched] = useState(false);
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [status, setStatus] = useState('active');
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Parent choices are scoped to the selected company; exclude the category being edited.
    const { data: categoryOptions = [] } = useProductCategoryOptions(companyId || undefined);
    const parentChoices = categoryOptions.filter((option) => option.id !== category?.id);

    useEffect(() => {
        if (open) {
            setCompanyId(category?.company_id ?? '');
            setParentId(category?.parent_id ?? '');
            setName(category?.name ?? '');
            setSlug(category?.slug ?? '');
            setSlugTouched(isEdit);
            setDescription(category?.description ?? '');
            setImageUrl(category?.image_url ?? '');
            setStatus(category?.status ?? 'active');
            setErrors({});
        }
    }, [open, category, isEdit]);

    const handleName = (value: string) => {
        setName(value);
        if (!slugTouched) {
            setSlug(slugify(value));
        }
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            company_id: companyId,
            parent_id: parentId || null,
            name,
            slug,
            description,
            image_url: imageUrl,
            status,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Category updated.' : 'Category created.');
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
            updateCategory.mutate({ id: category.id, ...payload }, { onSuccess, onError });
        } else {
            createCategory.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit category' : 'New category'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the category details below.' : 'Add a product category for a company.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="category-company">Company</Label>
                        <Select
                            value={companyId || undefined}
                            onValueChange={(value) => {
                                setCompanyId(value);
                                setParentId('');
                            }}
                        >
                            <SelectTrigger id="category-company">
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
                        <Label htmlFor="category-name">Name</Label>
                        <Input id="category-name" value={name} onChange={(e) => handleName(e.target.value)} placeholder="e.g. Beverages" autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category-slug">Slug</Label>
                        <Input
                            id="category-slug"
                            value={slug}
                            onChange={(e) => {
                                setSlugTouched(true);
                                setSlug(e.target.value);
                            }}
                            placeholder="e.g. beverages"
                        />
                        <InputError message={errors.slug?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category-parent">Parent category</Label>
                        <Select value={parentId || NONE_VALUE} onValueChange={(value) => setParentId(value === NONE_VALUE ? '' : value)}>
                            <SelectTrigger id="category-parent">
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                {parentChoices.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.parent_id?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category-description">Description</Label>
                        <Input id="category-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                        <InputError message={errors.description?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category-image">Image URL</Label>
                        <Input id="category-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                        <InputError message={errors.image_url?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category-status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="category-status">
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
                            {isEdit ? 'Save changes' : 'Create category'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
