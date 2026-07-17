import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useFeatureControls, useSaveFeatureControls } from '@/hooks/featureControls/useFeatureControls';
import AppLayout from '@/layouts/app-layout';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { BreadcrumbItem, FeatureFlag } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/feature-controls' },
    { title: 'Feature controls', href: '/feature-controls' },
];

export default function FeatureControls() {
    const [companyId, setCompanyId] = useState<string | undefined>(undefined);
    const [draft, setDraft] = useState<Record<string, boolean>>({});

    const { data, isPending, isError, refetch } = useFeatureControls(companyId);
    const save = useSaveFeatureControls();

    // Held in a ref so the hydrate effect can read the freshest flags without
    // listing `data` as a dependency and re-running on every refetch.
    const flagsRef = useRef(data?.flags);
    flagsRef.current = data?.flags;

    // Hydrate the switches once per company rather than on every fetch, so a
    // background refetch cannot wipe changes that have not been saved yet. Keyed on
    // company_id alone: including `data` would re-run on each refetch and defeat it.
    const loadedCompany = data?.company_id ?? null;

    useEffect(() => {
        if (!loadedCompany) {
            return;
        }

        setDraft(Object.fromEntries((flagsRef.current ?? []).map((flag) => [flag.key, flag.value])));
    }, [loadedCompany]);

    const grouped = useMemo(() => {
        const groups = new Map<string, FeatureFlag[]>();

        for (const flag of data?.flags ?? []) {
            groups.set(flag.group, [...(groups.get(flag.group) ?? []), flag]);
        }

        return [...groups.entries()];
    }, [data]);

    const dirty = useMemo(
        () => (data?.flags ?? []).some((flag) => draft[flag.key] !== flag.value),
        [data, draft],
    );

    const onSave = () => {
        const target = data?.company_id;

        if (!target) {
            return;
        }

        save.mutate(
            { companyId: target, flags: draft },
            {
                onSuccess: () => toast.success('Feature controls saved.'),
                onError: (error: Error) => {
                    const message =
                        error instanceof ApiError ? (Object.values(error.errors)[0]?.[0] ?? error.message) : error.message;
                    toast.error(message);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Feature controls" />

            <div className="flex flex-col gap-4 p-4">
                <Alert>
                    <AlertDescription>
                        These switch capabilities on and off for a whole company. They are not permissions — who may open a page is
                        decided by roles and modules — and they are not terminal behaviour, which lives on each POS profile.
                    </AlertDescription>
                </Alert>

                <div className="flex flex-wrap items-center gap-2">
                    {(data?.companies.length ?? 0) > 1 && (
                        <Select value={data?.company_id ?? ''} onValueChange={setCompanyId}>
                            <SelectTrigger className="w-56">
                                <SelectValue placeholder="Company" />
                            </SelectTrigger>
                            <SelectContent>
                                {data?.companies.map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                        {company.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Button className="ml-auto" onClick={onSave} disabled={!dirty || save.isPending}>
                        {save.isPending ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>

                {isError && (
                    <Alert variant="destructive">
                        <AlertDescription className="flex items-center justify-between gap-4">
                            Could not load the feature controls.
                            <Button size="sm" variant="outline" onClick={() => refetch()}>
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {isPending &&
                    Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-lg" />)}

                {grouped.map(([group, flags]) => (
                    <section key={group} className="rounded-lg border">
                        <h2 className="border-b px-4 py-2.5 text-sm font-medium">{group}</h2>
                        <div className="divide-y">
                            {flags.map((flag) => (
                                <label key={flag.key} className="flex cursor-pointer items-start justify-between gap-6 px-4 py-3">
                                    <span className="grid gap-0.5">
                                        <span className="flex items-center gap-2 text-sm font-medium">
                                            {flag.label}
                                            {draft[flag.key] !== flag.default && (
                                                <Badge variant="outline" className="font-normal">
                                                    Changed from default
                                                </Badge>
                                            )}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{flag.description}</span>
                                    </span>

                                    <Switch
                                        checked={draft[flag.key] ?? flag.value}
                                        onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, [flag.key]: checked }))}
                                    />
                                </label>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </AppLayout>
    );
}
