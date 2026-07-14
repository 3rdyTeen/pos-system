import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteBranch } from '@/hooks/branches/useBranchMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Branch } from '@/types';

interface BranchDeleteDialogProps {
    branch: Branch | null;
    onOpenChange: (open: boolean) => void;
}

export function BranchDeleteDialog({ branch, onOpenChange }: BranchDeleteDialogProps) {
    const deleteBranch = useDeleteBranch();

    const confirm = () => {
        if (!branch) {
            return;
        }

        deleteBranch.mutate(branch.id, {
            onSuccess: () => {
                toast.success('Branch deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete branch.');
            },
        });
    };

    return (
        <Dialog open={branch !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete branch</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{branch?.name}</span>? Branches with registers or
                    assigned users cannot be deleted. This action cannot be undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteBranch.isPending}>
                        Delete branch
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
