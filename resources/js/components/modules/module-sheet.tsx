import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCreateModule, useUpdateModule } from '@/hooks/modules/useModuleMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Module } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface ModuleSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    module: Module | null;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

export function ModuleSheet({ open, onOpenChange, module }: ModuleSheetProps) {
    const isEdit = module !== null;
    const createModule = useCreateModule();
    const updateModule = useUpdateModule();
    const processing = createModule.isPending || updateModule.isPending;

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [codeTouched, setCodeTouched] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setName(module?.name ?? '');
            setCode(module?.code ?? '');
            setCodeTouched(isEdit);
            setIsEnabled(module?.is_enabled ?? true);
            setErrors({});
        }
    }, [open, module, isEdit]);

    const handleName = (value: string) => {
        setName(value);
        if (!codeTouched) {
            setCode(slugify(value));
        }
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = { name, code, is_enabled: isEnabled };

        const onSuccess = () => {
            toast.success(isEdit ? 'Module updated.' : 'Module created.');
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
            updateModule.mutate({ id: module.id, ...payload }, { onSuccess, onError });
        } else {
            createModule.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit module' : 'New module'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the module details below.' : 'Create an application module.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="module-name">Module name</Label>
                        <Input id="module-name" value={name} onChange={(e) => handleName(e.target.value)} autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="module-code">Module code</Label>
                        <Input
                            id="module-code"
                            value={code}
                            onChange={(e) => {
                                setCodeTouched(true);
                                setCode(e.target.value);
                            }}
                            placeholder="e.g. inventory"
                        />
                        <p className="text-muted-foreground text-xs">Lowercase letters, numbers, dashes. Used to build permission codes.</p>
                        <InputError message={errors.code?.[0]} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch checked={isEnabled} onCheckedChange={setIsEnabled} aria-label="Enabled" />
                        <Label>Enabled</Label>
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create module'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
