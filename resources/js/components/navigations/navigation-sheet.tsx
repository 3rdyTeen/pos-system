import { IconPicker } from '@/components/icon-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useEnabledModules } from '@/hooks/modules/useModules';
import { useCreateNavigation, useUpdateNavigation } from '@/hooks/navigations/useNavigationMutations';
import { useNavigations } from '@/hooks/navigations/useNavigations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Navigation } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

const NO_PARENT = '__none__';

interface NavigationSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    navigation: Navigation | null;
    onChanged: () => void;
}

export function NavigationSheet({ open, onOpenChange, navigation, onChanged }: NavigationSheetProps) {
    const isEdit = navigation !== null;
    const { data: modules = [] } = useEnabledModules();
    const createNavigation = useCreateNavigation();
    const updateNavigation = useUpdateNavigation();
    const processing = createNavigation.isPending || updateNavigation.isPending;

    const [moduleId, setModuleId] = useState('');
    const [parentId, setParentId] = useState<string>(NO_PARENT);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [icon, setIcon] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const [order, setOrder] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Parent options: navigations within the selected module (excluding self).
    const { data: parentData } = useNavigations({
        search: '',
        module_id: moduleId || 'all',
        sort: 'name',
        direction: 'asc',
        page: 1,
    });
    const parentOptions = (parentData?.data ?? []).filter((n) => n.id !== navigation?.id && n.module_id === moduleId);

    useEffect(() => {
        if (open) {
            setModuleId(navigation?.module_id ?? '');
            setParentId(navigation?.parent_id ?? NO_PARENT);
            setName(navigation?.name ?? '');
            setCode(navigation?.code ?? '');
            setIcon(navigation?.icon ?? null);
            setUrl(navigation?.url ?? '');
            setOrder(navigation?.order != null ? String(navigation.order) : '');
            setErrors({});
        }
    }, [open, navigation]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            module_id: moduleId,
            parent_id: parentId === NO_PARENT ? null : parentId,
            name,
            code,
            icon,
            url,
            order: order === '' ? null : Number(order),
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'Navigation updated.' : 'Navigation created.');
            onOpenChange(false);
            onChanged();
        };

        const onError = (error: Error) => {
            if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
                setErrors(error.errors);
            } else {
                toast.error(error.message || 'Something went wrong.');
            }
        };

        if (isEdit) {
            updateNavigation.mutate({ id: navigation.id, ...payload }, { onSuccess, onError });
        } else {
            createNavigation.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit navigation' : 'New navigation'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the navigation item.' : 'Add a menu item to the sidebar.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="nav-module">Module</Label>
                        <Select
                            value={moduleId || undefined}
                            onValueChange={(value) => {
                                setModuleId(value);
                                setParentId(NO_PARENT);
                            }}
                        >
                            <SelectTrigger id="nav-module">
                                <SelectValue placeholder="Select a module" />
                            </SelectTrigger>
                            <SelectContent>
                                {modules.map((module) => (
                                    <SelectItem key={module.id} value={module.id}>
                                        {module.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.module_id?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="nav-parent">Parent navigation</Label>
                        <Select value={parentId} onValueChange={setParentId} disabled={!moduleId}>
                            <SelectTrigger id="nav-parent">
                                <SelectValue placeholder="None (top level)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_PARENT}>None (top level)</SelectItem>
                                {parentOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.parent_id?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="nav-name">Navigation name</Label>
                        <Input id="nav-name" value={name} onChange={(e) => setName(e.target.value)} />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="nav-code">Navigation code</Label>
                        <Input id="nav-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. inventory-items" />
                        <InputError message={errors.code?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="nav-url">URL</Label>
                        <Input id="nav-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/inventory" />
                        <InputError message={errors.url?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Icon</Label>
                        <IconPicker value={icon} onChange={setIcon} />
                        <InputError message={errors.icon?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="nav-order">Order (optional)</Label>
                        <Input
                            id="nav-order"
                            type="number"
                            min={0}
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                            placeholder="Auto (last position)"
                        />
                        <p className="text-muted-foreground text-xs">Leave blank to place it last within its parent.</p>
                        <InputError message={errors.order?.[0]} />
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create navigation'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
