import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteProductBarcode } from '@/hooks/products/useProductBarcodes';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { ProductBarcode } from '@/types';

interface ProductBarcodeDeleteDialogProps {
    productId: string;
    barcode: ProductBarcode | null;
    onOpenChange: (open: boolean) => void;
}

export function ProductBarcodeDeleteDialog({ productId, barcode, onOpenChange }: ProductBarcodeDeleteDialogProps) {
    const deleteBarcode = useDeleteProductBarcode(productId);

    const confirm = () => {
        if (!barcode) {
            return;
        }

        deleteBarcode.mutate(barcode.id, {
            onSuccess: () => {
                toast.success('Barcode deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete barcode.');
            },
        });
    };

    return (
        <Dialog open={barcode !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete barcode</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{barcode?.barcode}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteBarcode.isPending}>
                        Delete barcode
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
