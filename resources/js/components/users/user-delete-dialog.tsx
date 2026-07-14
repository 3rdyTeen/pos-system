import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteUser } from '@/hooks/users/useUserMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { AdminUser } from '@/types';

interface UserDeleteDialogProps {
    user: AdminUser | null;
    onOpenChange: (open: boolean) => void;
}

export function UserDeleteDialog({ user, onOpenChange }: UserDeleteDialogProps) {
    const deleteUser = useDeleteUser();

    const confirm = () => {
        if (!user) {
            return;
        }

        deleteUser.mutate(user.id, {
            onSuccess: () => {
                toast.success('User deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete user.');
            },
        });
    };

    return (
        <Dialog open={user !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete user</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{user?.name}</span>? They will be removed from the
                    list. This action can be undone by a database administrator.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteUser.isPending}>
                        Delete user
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
