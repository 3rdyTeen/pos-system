import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useEnabledRoles } from '@/hooks/roles/useRoles';
import { useInitials } from '@/hooks/use-initials';
import { useCreateUser, useUpdateUser } from '@/hooks/users/useUserMutations';
import { ApiError, ValidationErrors } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { AdminUser } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';

interface UserSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: AdminUser | null;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB, matches the backend rule.

export function UserSheet({ open, onOpenChange, user }: UserSheetProps) {
    const isEdit = user !== null;
    const getInitials = useInitials();
    const { data: enabledRoles = [] } = useEnabledRoles();
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const processing = createUser.isPending || updateUser.isPending;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [isEnabled, setIsEnabled] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errors, setErrors] = useState<ValidationErrors>({});

    // The user's saved role may have since been disabled; only offer enabled roles.
    const roleStillEnabled = user?.role_id ? enabledRoles.some((r) => r.id === user.role_id) : false;
    const roleNeedsReset = isEdit && !!user?.role_id && enabledRoles.length > 0 && !roleStillEnabled;

    useEffect(() => {
        if (open) {
            setName(user?.name ?? '');
            setEmail(user?.email ?? '');
            setPassword('');
            setRoleId(user?.role_id && roleStillEnabled ? user.role_id : '');
            setIsEnabled(user?.is_enabled ?? true);
            setImageFile(null);
            setPreviewUrl(null);
            setErrors({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user, enabledRoles.length]);

    // Revoke object URLs to avoid leaks.
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Image must be a JPG, PNG or WEBP file.');
            return;
        }

        if (file.size > MAX_SIZE) {
            toast.error('Image must be 2 MB or smaller.');
            return;
        }

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        setErrors({});

        const payload = {
            name,
            email,
            password: password || undefined,
            role_id: roleId,
            is_enabled: isEnabled,
            image: imageFile,
        };

        const onSuccess = () => {
            toast.success(isEdit ? 'User updated.' : 'User created.');
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
            updateUser.mutate({ id: user.id, ...payload }, { onSuccess, onError });
        } else {
            createUser.mutate(payload, { onSuccess, onError });
        }
    };

    const avatarSrc = previewUrl ?? user?.profile_image_url ?? undefined;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>{isEdit ? 'Edit user' : 'New user'}</SheetTitle>
                    <SheetDescription>{isEdit ? 'Update the user details below.' : 'Create a new user account.'}</SheetDescription>
                </SheetHeader>

                <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={avatarSrc} alt={name} />
                            <AvatarFallback>{name ? getInitials(name) : '?'}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-2">
                            <Label htmlFor="user-image">Profile image</Label>
                            <Input
                                id="user-image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileChange}
                                className="cursor-pointer"
                            />
                            <p className="text-muted-foreground text-xs">JPG, PNG or WEBP, up to 2 MB.</p>
                        </div>
                    </div>
                    <InputError message={errors.image?.[0]} />

                    <div className="grid gap-2">
                        <Label htmlFor="user-name">Name</Label>
                        <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                        <InputError message={errors.name?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="user-email">Email</Label>
                        <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <InputError message={errors.email?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="user-password">{isEdit ? 'New password' : 'Password'}</Label>
                        <Input
                            id="user-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isEdit ? 'Leave blank to keep current password' : ''}
                            autoComplete="new-password"
                        />
                        <InputError message={errors.password?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="user-role">Role</Label>
                        <Select value={roleId || undefined} onValueChange={setRoleId}>
                            <SelectTrigger id="user-role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {enabledRoles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {roleNeedsReset && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                This user's previous role is disabled. Choose an enabled role to save changes.
                            </p>
                        )}
                        <InputError message={errors.role_id?.[0]} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox id="user-enabled" checked={isEnabled} onCheckedChange={(checked) => setIsEnabled(checked === true)} />
                        <Label htmlFor="user-enabled">Enabled</Label>
                    </div>

                    <SheetFooter className="mt-auto gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Save changes' : 'Create user'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
