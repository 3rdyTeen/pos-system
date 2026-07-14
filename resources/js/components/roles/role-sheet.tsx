import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRole, useUpdateRole } from '@/hooks/roles/useRoleMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Role } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface RoleSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: Role | null;
}

export function RoleSheet({ open, onOpenChange, role }: RoleSheetProps) {
    const isEdit = role !== null;
    const createRole = useCreateRole();
    const updateRole = useUpdateRole();
    const processing = createRole.isPending || updateRole.isPending;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isEnabled, setIsEnabled] = useState(true);
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Sync form state whenever the sheet opens or the target role changes.
    useEffect(() => {
        if (open) {
            setName(role?.name ?? '');
            setDescription(role?.description ?? '');
            setIsEnabled(role?.is_enabled ?? true);
            setErrors({});
        }
    }, [open, role]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = { name, description, is_enabled: isEnabled };

        const onSuccess = () => {
            toast.success(isEdit ? 'Role updated.' : 'Role created.');
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
            updateRole.mutate({ id: role.id, ...payload }, { onSuccess, onError });
        } else {
            createRole.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit role' : 'New role'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the role details below.' : 'Create a role that can be assigned to users.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="role-name">Name</Label>
                        <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role-description">Description</Label>
                        <Textarea id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                        <InputError message={errors.description?.[0]} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox id="role-enabled" checked={isEnabled} onCheckedChange={(checked) => setIsEnabled(checked === true)} />
                        <Label htmlFor="role-enabled">Enabled</Label>
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create role'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
