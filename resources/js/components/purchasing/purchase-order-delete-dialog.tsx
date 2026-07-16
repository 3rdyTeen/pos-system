import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeletePurchaseOrder } from '@/hooks/purchaseOrders/usePurchaseOrders';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { PurchaseOrder } from '@/types';

interface PurchaseOrderDeleteDialogProps {
    order: PurchaseOrder | null;
    onOpenChange: (open: boolean) => void;
}

export function PurchaseOrderDeleteDialog({ order, onOpenChange }: PurchaseOrderDeleteDialogProps) {
    const deleteOrder = useDeletePurchaseOrder();

    const confirm = () => {
        if (!order) {
            return;
        }

        deleteOrder.mutate(order.id, {
            onSuccess: () => {
                toast.success('Purchase order deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                // The service refuses to delete an order that has returns against it.
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete purchase order.');
            },
        });
    };

    return (
        <Dialog open={order !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete purchase order</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{order?.po_number}</span>, along with its lines and
                    payments? This action cannot be undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteOrder.isPending}>
                        Delete order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
