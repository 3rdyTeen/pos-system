import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useCreatePermission, useUpdatePermission } from '@/hooks/permissions/usePermissionMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Permission } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface PermissionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    permission: Permission | null;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

export function PermissionSheet({ open, onOpenChange, permission }: PermissionSheetProps) {
    const isEdit = permission !== null;
    const createPermission = useCreatePermission();
    const updatePermission = useUpdatePermission();
    const processing = createPermission.isPending || updatePermission.isPending;

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [codeTouched, setCodeTouched] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (open) {
            setName(permission?.name ?? '');
            setCode(permission?.code ?? '');
            setCodeTouched(isEdit);
            setIsEnabled(permission?.is_enabled ?? true);
            setErrors({});
        }
    }, [open, permission, isEdit]);

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
            toast.success(isEdit ? 'Permission updated.' : 'Permission created.');
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
            updatePermission.mutate({ id: permission.id, ...payload }, { onSuccess, onError });
        } else {
            createPermission.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit permission' : 'New permission'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the permission details below.' : 'Create a reusable permission action.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="permission-name">Name</Label>
                        <Input id="permission-name" value={name} onChange={(e) => handleName(e.target.value)} placeholder="e.g. View" autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="permission-code">Code</Label>
                        <Input
                            id="permission-code"
                            value={code}
                            onChange={(e) => {
                                setCodeTouched(true);
                                setCode(e.target.value);
                            }}
                            placeholder="e.g. view"
                        />
                        <p className="text-muted-foreground text-xs">Combined with a module code to form "{'{module}.{code}'}".</p>
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
                            {isEdit ? 'Save changes' : 'Create permission'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
