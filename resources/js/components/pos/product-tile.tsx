import { cn } from '@/lib/utils';
import { PosProduct } from '@/types';
import { money } from './cart-summary';

interface Props {
    product: PosProduct;
    onSelect: () => void;
    /** When false, the control page has turned stock off for the terminal. */
    showStock: boolean;
}

/**
 * A tappable product.
 *
 * The price is the second thing a cashier looks for after the name, so it is the
 * only other thing on the tile. Stock is shown only when it is low or gone —
 * a badge on every tile would be noise on the one case that never matters.
 */
export function ProductTile({ product, onSelect, showStock }: Props) {
    const onHand = !showStock || product.stock_on_hand === null ? null : Number(product.stock_on_hand);
    const out = onHand !== null && onHand <= 0;
    const low = onHand !== null && onHand > 0 && onHand <= 5;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'relative flex h-24 flex-col justify-between rounded-lg border p-3 text-left transition',
                'hover:border-primary/40 hover:bg-accent active:scale-[0.98]',
                out && 'opacity-60',
            )}
        >
            <span className="line-clamp-2 text-sm leading-tight font-medium">{product.name}</span>

            <span className="flex items-end justify-between gap-1">
                <span className="text-base font-semibold tabular-nums">{money(product.unit_price)}</span>

                {out && <span className="text-[10px] font-medium text-destructive uppercase">Out</span>}
                {low && <span className="text-[10px] font-medium text-amber-600 uppercase dark:text-amber-500">{onHand} left</span>}
            </span>
        </button>
    );
}
