import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteRole } from '@/hooks/roles/useRoleMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Role } from '@/types';

interface RoleDeleteDialogProps {
    role: Role | null;
    onOpenChange: (open: boolean) => void;
}

export function RoleDeleteDialog({ role, onOpenChange }: RoleDeleteDialogProps) {
    const deleteRole = useDeleteRole();
    const assignedCount = role?.users_count ?? 0;
    const hasUsers = assignedCount > 0;

    const confirm = () => {
        if (!role) {
            return;
        }

        deleteRole.mutate(role.id, {
            onSuccess: () => {
                toast.success('Role deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete role.');
            },
        });
    };

    return (
        <Dialog open={role !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete role</DialogTitle>
                <DialogDescription>
                    {hasUsers ? (
                        <>
                            <span className="text-foreground font-medium">{role?.name}</span> is assigned to {assignedCount} user
                            {assignedCount === 1 ? '' : 's'} and cannot be deleted. Reassign those users to another role first.
                        </>
                    ) : (
                        <>
                            Are you sure you want to delete <span className="text-foreground font-medium">{role?.name}</span>? This action can be
                            undone by a database administrator.
                        </>
                    )}
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={hasUsers || deleteRole.isPending}>
                        Delete role
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
