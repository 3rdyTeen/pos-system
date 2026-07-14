import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useDeleteCompany } from '@/hooks/companies/useCompanyMutations';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { Company } from '@/types';

interface CompanyDeleteDialogProps {
    company: Company | null;
    onOpenChange: (open: boolean) => void;
}

export function CompanyDeleteDialog({ company, onOpenChange }: CompanyDeleteDialogProps) {
    const deleteCompany = useDeleteCompany();
    const branchCount = company?.branches_count ?? 0;
    const hasBranches = branchCount > 0;

    const confirm = () => {
        if (!company) {
            return;
        }

        deleteCompany.mutate(company.id, {
            onSuccess: () => {
                toast.success('Company deleted.');
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(error instanceof ApiError ? error.message : 'Failed to delete company.');
            },
        });
    };

    return (
        <Dialog open={company !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete company</DialogTitle>
                <DialogDescription>
                    {hasBranches ? (
                        <>
                            <span className="text-foreground font-medium">{company?.name}</span> has {branchCount} branch
                            {branchCount === 1 ? '' : 'es'} and cannot be deleted. Remove those branches first.
                        </>
                    ) : (
                        <>
                            Are you sure you want to delete <span className="text-foreground font-medium">{company?.name}</span>? This action cannot be
                            undone.
                        </>
                    )}
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={confirm} disabled={hasBranches || deleteCompany.isPending}>
                        Delete company
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
