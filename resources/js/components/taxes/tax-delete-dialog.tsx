import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteTax } from '@/hooks/taxes/useTaxMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Tax } from '@/types';

interface TaxDeleteDialogProps {
    tax: Tax | null;
    onOpenChange: (open: boolean) => void;
}

export function TaxDeleteDialog({ tax, onOpenChange }: TaxDeleteDialogProps) {
    const deleteTax = useDeleteTax();

    const confirm = () => {
        if (!tax) {
            return;
        }

        deleteTax.mutate(tax.id, {
            onSuccess: () => {
                toast.success('Tax deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete tax.');
            },
        });
    };

    return (
        <Dialog open={tax !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete tax</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{tax?.name}</span>? This action cannot be undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteTax.isPending}>
                        Delete tax
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
