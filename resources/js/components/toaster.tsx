import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToastStore } from '@/stores/toastStore';
import { CheckCircle2, X, XCircle } from 'lucide-react';

/**
 * Renders queued toasts from the Zustand store using the existing Alert primitive.
 * Mounted once globally in app.tsx.
 */
export function Toaster() {
    const toasts = useToastStore((state) => state.toasts);
    const dismiss = useToastStore((state) => state.dismiss);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2">
            {toasts.map((toast) => (
                <Alert
                    key={toast.id}
                    variant={toast.variant === 'error' ? 'destructive' : 'default'}
                    className="bg-background pointer-events-auto pr-10 shadow-lg"
                >
                    {toast.variant === 'error' ? <XCircle /> : <CheckCircle2 />}
                    <AlertDescription>{toast.message}</AlertDescription>
                    <button
                        type="button"
                        onClick={() => dismiss(toast.id)}
                        className="text-muted-foreground hover:text-foreground absolute top-4 right-3 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </Alert>
            ))}
        </div>
    );
}
