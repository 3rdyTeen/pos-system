import { CartLine } from '@/types';

export interface CartTotals {
    subtotal: number;
    discount: number;
    tax: number;
    grand: number;
}

/**
 * Mirrors SaleService::price() for the on-screen running total.
 *
 * This is a preview only and is never sent: the server reprices the cart from the
 * catalogue when the sale is rung up, so if these two ever disagree the server is
 * right. It exists so the cashier sees a total change the instant they tap, rather
 * than after a round trip.
 */
export function cartTotals(lines: CartLine[]): CartTotals {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let grand = 0;

    for (const line of lines) {
        const gross = round2(Number(line.quantity || 0) * Number(line.unit_price || 0));
        const lineDiscount = round2(Number(line.discount_amount || 0));
        const net = round2(gross - lineDiscount);
        const rate = Number(line.tax_rate ?? 0);

        let lineTax = 0;
        let lineTotal = net;

        if (rate > 0) {
            if (line.tax_inclusive) {
                // The shelf price already contains the tax; carve it back out.
                lineTax = round2(net - net / (1 + rate / 100));
            } else {
                lineTax = round2(net * (rate / 100));
                lineTotal = round2(net + lineTax);
            }
        }

        subtotal += gross;
        discount += lineDiscount;
        tax += lineTax;
        grand += lineTotal;
    }

    return {
        subtotal: round2(subtotal),
        discount: round2(discount),
        tax: round2(tax),
        grand: round2(grand),
    };
}

export function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function money(value: number | string): string {
    return Number(value).toFixed(2);
}
