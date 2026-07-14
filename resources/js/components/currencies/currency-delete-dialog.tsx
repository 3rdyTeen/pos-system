import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteCurrency } from '@/hooks/currencies/useCurrencyMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Currency } from '@/types';

interface CurrencyDeleteDialogProps {
    currency: Currency | null;
    onOpenChange: (open: boolean) => void;
}

export function CurrencyDeleteDialog({ currency, onOpenChange }: CurrencyDeleteDialogProps) {
    const deleteCurrency = useDeleteCurrency();

    const confirm = () => {
        if (!currency) {
            return;
        }

        deleteCurrency.mutate(currency.id, {
            onSuccess: () => {
                toast.success('Currency deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete currency.');
            },
        });
    };

    return (
        <Dialog open={currency !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete currency</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{currency?.name}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteCurrency.isPending}>
                        Delete currency
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
