import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Placeholder({ module }: { module: string }) {
    return (
        <AppLayout>
            <Head title={module} />
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                <h1 className="text-xl font-semibold">{module}</h1>
                <p className="text-muted-foreground text-sm">
                    This is a placeholder page for the {module} module, reachable because your role has{' '}
                    <code className="bg-muted rounded px-1 py-0.5">{module.toLowerCase()}.view</code>.
                </p>
            </div>
        </AppLayout>
    );
}
