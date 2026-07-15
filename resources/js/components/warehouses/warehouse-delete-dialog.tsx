import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteWarehouse } from '@/hooks/warehouses/useWarehouseMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Warehouse } from '@/types';

interface WarehouseDeleteDialogProps {
    warehouse: Warehouse | null;
    onOpenChange: (open: boolean) => void;
}

export function WarehouseDeleteDialog({ warehouse, onOpenChange }: WarehouseDeleteDialogProps) {
    const deleteWarehouse = useDeleteWarehouse();

    const confirm = () => {
        if (!warehouse) {
            return;
        }

        deleteWarehouse.mutate(warehouse.id, {
            onSuccess: () => {
                toast.success('Warehouse deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                // The service refuses to delete a warehouse that still holds stock.
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete warehouse.');
            },
        });
    };

    return (
        <Dialog open={warehouse !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete warehouse</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{warehouse?.name}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteWarehouse.isPending}>
                        Delete warehouse
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
