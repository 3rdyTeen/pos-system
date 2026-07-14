import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteProduct } from '@/hooks/products/useProductMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Product } from '@/types';

interface ProductDeleteDialogProps {
    product: Product | null;
    onOpenChange: (open: boolean) => void;
}

export function ProductDeleteDialog({ product, onOpenChange }: ProductDeleteDialogProps) {
    const deleteProduct = useDeleteProduct();

    const confirm = () => {
        if (!product) {
            return;
        }

        deleteProduct.mutate(product.id, {
            onSuccess: () => {
                toast.success('Product deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete product.');
            },
        });
    };

    return (
        <Dialog open={product !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete product</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{product?.name}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteProduct.isPending}>
                        Delete product
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
