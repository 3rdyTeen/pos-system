import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SortDirection } from '@/types';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

interface SortableHeaderProps {
    label: string;
    column: string;
    sort: string;
    direction: SortDirection;
    onSort: (column: string) => void;
    className?: string;
}

export function SortableHeader({ label, column, sort, direction, onSort, className }: SortableHeaderProps) {
    const active = sort === column;

    return (
        <TableHead className={className}>
            <button
                type="button"
                onClick={() => onSort(column)}
                className={cn('hover:text-foreground inline-flex items-center gap-1 transition-colors', active && 'text-foreground')}
            >
                {label}
                {active ? (
                    direction === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                    )
                ) : (
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                )}
            </button>
        </TableHead>
    );
}
