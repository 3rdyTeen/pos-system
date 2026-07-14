import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteRegister } from '@/hooks/registers/useRegisterMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Register } from '@/types';

interface RegisterDeleteDialogProps {
    register: Register | null;
    onOpenChange: (open: boolean) => void;
}

export function RegisterDeleteDialog({ register, onOpenChange }: RegisterDeleteDialogProps) {
    const deleteRegister = useDeleteRegister();

    const confirm = () => {
        if (!register) {
            return;
        }

        deleteRegister.mutate(register.id, {
            onSuccess: () => {
                toast.success('Register deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete register.');
            },
        });
    };

    return (
        <Dialog open={register !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete register</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{register?.name}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteRegister.isPending}>
                        Delete register
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
