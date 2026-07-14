import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteUnit } from '@/hooks/units/useUnitMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Unit } from '@/types';

interface UnitDeleteDialogProps {
    unit: Unit | null;
    onOpenChange: (open: boolean) => void;
}

export function UnitDeleteDialog({ unit, onOpenChange }: UnitDeleteDialogProps) {
    const deleteUnit = useDeleteUnit();

    const confirm = () => {
        if (!unit) {
            return;
        }

        deleteUnit.mutate(unit.id, {
            onSuccess: () => {
                toast.success('Unit deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete unit.');
            },
        });
    };

    return (
        <Dialog open={unit !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete unit</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <span className="text-foreground font-medium">{unit?.name}</span>? This action cannot be undone.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={deleteUnit.isPending}>
                        Delete unit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
