import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteProductUnit } from '@/hooks/products/useProductUnits';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { ProductUnit } from '@/types';

interface ProductUnitDeleteDialogProps {
    productId: string;
    productUnit: ProductUnit | null;
    onOpenChange: (open: boolean) => void;
}

export function ProductUnitDeleteDialog({ productId, productUnit, onOpenChange }: ProductUnitDeleteDialogProps) {
    const deleteProductUnit = useDeleteProductUnit(productId);

    const confirm = () => {
        if (!productUnit) {
            return;
        }

        deleteProductUnit.mutate(productUnit.id, {
            onSuccess: () => {
                toast.success('Unit removed.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to remove unit.');
            },
        });
    };

    return (
        <Dialog open={productUnit !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Remove unit</DialogTitle>
                <DialogDescription>
                    Are you sure you want to remove <span className="text-foreground font-medium">{productUnit?.unit?.name}</span> from this product?
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteProductUnit.isPending}>
                        Remove unit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
