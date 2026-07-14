import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeletePaymentMethod } from '@/hooks/paymentMethods/usePaymentMethodMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { PaymentMethod } from '@/types';

interface PaymentMethodDeleteDialogProps {
    paymentMethod: PaymentMethod | null;
    onOpenChange: (open: boolean) => void;
}

export function PaymentMethodDeleteDialog({ paymentMethod, onOpenChange }: PaymentMethodDeleteDialogProps) {
    const deletePaymentMethod = useDeletePaymentMethod();

    const confirm = () => {
        if (!paymentMethod) {
            return;
        }

        deletePaymentMethod.mutate(paymentMethod.id, {
            onSuccess: () => {
                toast.success('Payment method deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete payment method.');
            },
        });
    };

    return (
        <Dialog open={paymentMethod !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete payment method</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{paymentMethod?.name}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deletePaymentMethod.isPending}>
                        Delete payment method
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
