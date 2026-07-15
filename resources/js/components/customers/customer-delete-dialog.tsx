import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteCustomer } from '@/hooks/customers/useCustomerMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Customer } from '@/types';

interface CustomerDeleteDialogProps {
    customer: Customer | null;
    onOpenChange: (open: boolean) => void;
}

export function CustomerDeleteDialog({ customer, onOpenChange }: CustomerDeleteDialogProps) {
    const deleteCustomer = useDeleteCustomer();

    const confirm = () => {
        if (!customer) {
            return;
        }

        deleteCustomer.mutate(customer.id, {
            onSuccess: () => {
                toast.success('Customer deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete customer.');
            },
        });
    };

    return (
        <Dialog open={customer !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete customer</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{customer?.name}</span>? This action cannot be
                    undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteCustomer.isPending}>
                        Delete customer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
