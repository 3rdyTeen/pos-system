import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteProductCategory } from '@/hooks/productCategories/useProductCategoryMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { ProductCategory } from '@/types';

interface ProductCategoryDeleteDialogProps {
    category: ProductCategory | null;
    onOpenChange: (open: boolean) => void;
}

export function ProductCategoryDeleteDialog({ category, onOpenChange }: ProductCategoryDeleteDialogProps) {
    const deleteCategory = useDeleteProductCategory();

    const confirm = () => {
        if (!category) {
            return;
        }

        deleteCategory.mutate(category.id, {
            onSuccess: () => {
                toast.success('Category deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete category.');
            },
        });
    };

    return (
        <Dialog open={category !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete category</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{category?.name}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteCategory.isPending}>
                        Delete category
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
