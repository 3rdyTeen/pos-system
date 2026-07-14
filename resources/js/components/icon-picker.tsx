import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

/** Curated set of common lucide icons (kebab names) offered in the picker. */
const ICON_NAMES = [
    'layout-grid',
    'layout-dashboard',
    'boxes',
    'box',
    'package',
    'key-round',
    'lock',
    'shield',
    'shield-check',
    'list-tree',
    'list',
    'menu',
    'users',
    'user',
    'user-cog',
    'settings',
    'sliders-horizontal',
    'wrench',
    'shopping-cart',
    'shopping-bag',
    'store',
    'credit-card',
    'wallet',
    'receipt',
    'file-text',
    'files',
    'folder',
    'folder-tree',
    'clipboard-list',
    'chart-bar',
    'chart-line',
    'chart-pie',
    'chart-column',
    'trending-up',
    'gauge',
    'activity',
    'bell',
    'calendar',
    'clock',
    'mail',
    'message-square',
    'home',
    'building',
    'building-2',
    'warehouse',
    'truck',
    'tag',
    'tags',
    'bookmark',
    'star',
    'heart',
    'flag',
    'map-pin',
    'globe',
    'database',
    'server',
    'cpu',
    'hard-drive',
    'cloud',
    'download',
    'upload',
    'search',
    'filter',
    'plus',
    'pencil',
    'trash-2',
    'check',
    'circle',
    'square',
    'grid-2x2',
    'columns-3',
    'rows-3',
    'link',
    'external-link',
    'eye',
    'lock-keyhole',
    'book-open',
    'briefcase',
];

interface IconPickerProps {
    value: string | null;
    onChange: (name: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return term ? ICON_NAMES.filter((name) => name.includes(term)) : ICON_NAMES;
    }, [search]);

    return (
        <div className="rounded-md border">
            <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                    <Icon name={value} className="h-4 w-4" />
                    <span className={cn(!value && 'text-muted-foreground')}>{value ?? 'Select an icon'}</span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>

            {open && (
                <div className="border-t p-2">
                    <Input placeholder="Search icons..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2 h-9" />
                    <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
                        {filtered.map((name) => (
                            <Button
                                key={name}
                                type="button"
                                variant={value === name ? 'default' : 'ghost'}
                                size="icon"
                                title={name}
                                onClick={() => {
                                    onChange(name);
                                    setOpen(false);
                                }}
                            >
                                <Icon name={name} className="h-4 w-4" />
                            </Button>
                        ))}
                        {filtered.length === 0 && <p className="text-muted-foreground col-span-8 py-4 text-center text-sm">No icons found.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
