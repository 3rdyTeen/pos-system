import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeletePurchaseReturn } from '@/hooks/purchaseReturns/usePurchaseReturns';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { PurchaseReturn } from '@/types';

interface PurchaseReturnDeleteDialogProps {
    purchaseReturn: PurchaseReturn | null;
    onOpenChange: (open: boolean) => void;
}

export function PurchaseReturnDeleteDialog({ purchaseReturn, onOpenChange }: PurchaseReturnDeleteDialogProps) {
    const deleteReturn = useDeletePurchaseReturn();

    const confirm = () => {
        if (!purchaseReturn) {
            return;
        }

        deleteReturn.mutate(purchaseReturn.id, {
            onSuccess: () => {
                toast.success('Return deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete return.');
            },
        });
    };

    return (
        <Dialog open={purchaseReturn !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete return</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{purchaseReturn?.return_number}</span> and its lines?
                    This action cannot be undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteReturn.isPending}>
                        Delete return
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
