import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    const { props, url } = usePage<SharedData>();

    // Breadcrumbs are derived from the DB-driven navigation tree, not hardcoded.
    // Fall back to any explicitly provided breadcrumbs when the path is not in the nav.
    const derived = buildBreadcrumbs(props.navigation ?? [], url);
    const items = derived.length > 0 ? derived : breadcrumbs;

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={items} />
                {children}
            </AppContent>
        </AppShell>
    );
}
