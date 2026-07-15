import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteSupplier } from '@/hooks/suppliers/useSupplierMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Supplier } from '@/types';

interface SupplierDeleteDialogProps {
    supplier: Supplier | null;
    onOpenChange: (open: boolean) => void;
}

export function SupplierDeleteDialog({ supplier, onOpenChange }: SupplierDeleteDialogProps) {
    const deleteSupplier = useDeleteSupplier();

    const confirm = () => {
        if (!supplier) {
            return;
        }

        deleteSupplier.mutate(supplier.id, {
            onSuccess: () => {
                toast.success('Supplier deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete supplier.');
            },
        });
    };

    return (
        <Dialog open={supplier !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete supplier</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{supplier?.name}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteSupplier.isPending}>
                        Delete supplier
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
