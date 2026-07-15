import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteStockTransfer } from '@/hooks/stockTransfers/useStockTransfers';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { StockTransfer } from '@/types';

interface StockTransferDeleteDialogProps {
    transfer: StockTransfer | null;
    onOpenChange: (open: boolean) => void;
}

export function StockTransferDeleteDialog({ transfer, onOpenChange }: StockTransferDeleteDialogProps) {
    const deleteTransfer = useDeleteStockTransfer();

    const confirm = () => {
        if (!transfer) {
            return;
        }

        deleteTransfer.mutate(transfer.id, {
            onSuccess: () => {
                toast.success('Transfer deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete transfer.');
            },
        });
    };

    return (
        <Dialog open={transfer !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete transfer</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{transfer?.transfer_number}</span> and its lines?
                    This action cannot be undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteTransfer.isPending}>
                        Delete transfer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
