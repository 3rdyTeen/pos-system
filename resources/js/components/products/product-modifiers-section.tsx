import { money } from '@/components/pos/cart-summary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { ModifierGroup } from '@/types';
import { useModifierGroupOptions } from '@/hooks/modifierGroups/useModifierGroups';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Props {
    productId: string;
}

/**
 * Which choice groups this product offers at the till.
 *
 * Groups are built once on the Modifier groups page and attached here, so "Size"
 * is defined in one place and hung off every drink rather than retyped per product.
 */
export function ProductModifiersSection({ productId }: Props) {
    const queryClient = useQueryClient();
    const [selected, setSelected] = useState<string[]>([]);

    const { data: available } = useModifierGroupOptions();

    const { data: attached, isPending } = useQuery({
        queryKey: ['products', productId, 'modifier-groups'],
        queryFn: () => api.get<{ data: ModifierGroup[] }>(`/api/products/${productId}/modifier-groups`),
        select: (response) => response.data,
    });

    useEffect(() => {
        if (attached) {
            setSelected(attached.map((group) => group.id));
        }
    }, [attached]);

    const save = useMutation({
        mutationFn: (groupIds: string[]) =>
            api.put<{ data: ModifierGroup[] }>(`/api/products/${productId}/modifier-groups`, { group_ids: groupIds }),
        onSuccess: () => {
            toast.success('Modifiers updated.');
            queryClient.invalidateQueries({ queryKey: ['products', productId, 'modifier-groups'] });
            queryClient.invalidateQueries({ queryKey: ['pos'] });
        },
        onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
    });

    const dirty =
        attached !== undefined &&
        (selected.length !== attached.length || selected.some((id) => !attached.some((group) => group.id === id)));

    return (
        <Card>
            <CardContent className="grid gap-3 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-medium">Modifiers</h2>
                        <p className="text-xs text-muted-foreground">
                            Choices offered against this product at the till. Build them on the{' '}
                            <Link href="/modifier-groups" className="underline">
                                Modifier groups
                            </Link>{' '}
                            page.
                        </p>
                    </div>

                    <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate(selected)}>
                        {save.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </div>

                {isPending && <Skeleton className="h-20" />}

                {!isPending && (available ?? []).length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        No modifier groups exist yet.
                    </p>
                )}

                <div className="grid gap-1">
                    {(available ?? []).map((group) => (
                        <label key={group.id} className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-accent">
                            <Checkbox
                                checked={selected.includes(group.id)}
                                onCheckedChange={(checked) =>
                                    setSelected((prev) => (checked === true ? [...prev, group.id] : prev.filter((id) => id !== group.id)))
                                }
                            />
                            <span className="font-medium">{group.name}</span>
                            {group.is_required && (
                                <Badge variant="outline" className="font-normal">
                                    Required
                                </Badge>
                            )}
                            <span className="ml-auto truncate text-xs text-muted-foreground">
                                {(group.options ?? [])
                                    .map((option) =>
                                        Number(option.price_delta) === 0
                                            ? option.name
                                            : `${option.name} ${Number(option.price_delta) > 0 ? '+' : '−'}${money(Math.abs(Number(option.price_delta)))}`,
                                    )
                                    .join(', ')}
                            </span>
                        </label>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
