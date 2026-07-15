import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteStockAdjustment } from '@/hooks/stockAdjustments/useStockAdjustments';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { StockAdjustment } from '@/types';

interface StockAdjustmentDeleteDialogProps {
    adjustment: StockAdjustment | null;
    onOpenChange: (open: boolean) => void;
}

export function StockAdjustmentDeleteDialog({ adjustment, onOpenChange }: StockAdjustmentDeleteDialogProps) {
    const deleteAdjustment = useDeleteStockAdjustment();

    const confirm = () => {
        if (!adjustment) {
            return;
        }

        deleteAdjustment.mutate(adjustment.id, {
            onSuccess: () => {
                toast.success('Adjustment deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete adjustment.');
            },
        });
    };

    return (
        <Dialog open={adjustment !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete adjustment</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{adjustment?.adjustment_number}</span> and its
                    lines? This action cannot be undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteAdjustment.isPending}>
                        Delete adjustment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
