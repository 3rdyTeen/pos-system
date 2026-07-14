import { Button } from '@/components/ui/button';
import { Paginated } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
    meta: Paginated<unknown>['meta'];
    onPageChange: (page: number) => void;
    isFetching?: boolean;
}

export function TablePagination({ meta, onPageChange, isFetching }: TablePaginationProps) {
    return (
        <div className="text-muted-foreground flex items-center justify-between gap-4 px-1 py-2 text-sm">
            <span>
                {meta.total > 0 ? (
                    <>
                        Showing <span className="text-foreground font-medium">{meta.from}</span>–
                        <span className="text-foreground font-medium">{meta.to}</span> of{' '}
                        <span className="text-foreground font-medium">{meta.total}</span>
                    </>
                ) : (
                    'No results'
                )}
            </span>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(meta.current_page - 1)}
                    disabled={meta.current_page <= 1 || isFetching}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <span className="tabular-nums">
                    Page {meta.current_page} of {meta.last_page}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(meta.current_page + 1)}
                    disabled={meta.current_page >= meta.last_page || isFetching}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
