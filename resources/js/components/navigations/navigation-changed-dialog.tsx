import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { RefreshCw } from 'lucide-react';

interface NavigationChangedDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Shown after any navigation create/update/delete. Because the sidebar is
 * generated server-side per request, a reload is required to see the change.
 */
export function NavigationChangedDialog({ open, onOpenChange }: NavigationChangedDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Navigation updated</DialogTitle>
                <DialogDescription>
                    The application navigation has changed. A refresh is required for the updated menu to appear in the sidebar.
                </DialogDescription>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Later
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                        <RefreshCw className="h-4 w-4" />
                        Refresh now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
