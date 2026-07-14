import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteProductVariant } from '@/hooks/products/useProductVariants';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { ProductVariant } from '@/types';

interface ProductVariantDeleteDialogProps {
    productId: string;
    variant: ProductVariant | null;
    onOpenChange: (open: boolean) => void;
}

export function ProductVariantDeleteDialog({ productId, variant, onOpenChange }: ProductVariantDeleteDialogProps) {
    const deleteVariant = useDeleteProductVariant(productId);

    const confirm = () => {
        if (!variant) {
            return;
        }

        deleteVariant.mutate(variant.id, {
            onSuccess: () => {
                toast.success('Variant deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete variant.');
            },
        });
    };

    return (
        <Dialog open={variant !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete variant</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{variant?.variant_name}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteVariant.isPending}>
                        Delete variant
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
