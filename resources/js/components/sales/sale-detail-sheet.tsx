import { money } from '@/components/pos/cart-summary';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSale } from '@/hooks/sales/useSales';
import { Sale } from '@/types';

interface Props {
    sale: Sale | null;
    onOpenChange: (open: boolean) => void;
}

/**
 * The receipt view: what was sold, what tax was charged, and how it was paid.
 *
 * Refetches the sale rather than reusing the list row, because the list only
 * carries the header and this needs the lines.
 */
export function SaleDetailSheet({ sale, onOpenChange }: Props) {
    const { data, isPending } = useSale(sale?.id ?? '');

    return (
        <Sheet open={sale !== null} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>{sale?.sale_number}</SheetTitle>
                    <SheetDescription>
                        {sale?.customer?.name ?? 'Walk-in'} &middot; {sale?.register?.name ?? 'No register'}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6">
                    {isPending || !data ? (
                        <div className="grid gap-2">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Skeleton key={index} className="h-8" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.details?.map((detail) => (
                                        <TableRow key={detail.id}>
                                            <TableCell>
                                                {detail.product?.name ?? 'Item'}
                                                {detail.variant && (
                                                    <span className="text-muted-foreground"> ({detail.variant.name})</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">{detail.quantity}</TableCell>
                                            <TableCell className="text-right">{money(detail.unit_price)}</TableCell>
                                            <TableCell className="text-right">{money(detail.line_total)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="grid gap-1 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{money(data.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Discount</span>
                                    <span>-{money(data.discount_total)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tax</span>
                                    <span>{money(data.tax_total)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                                    <span>Total</span>
                                    <span>{money(data.grand_total)}</span>
                                </div>
                            </div>

                            {(data.taxes?.length ?? 0) > 0 && (
                                <div>
                                    <h4 className="mb-2 text-sm font-medium">Tax breakdown</h4>
                                    <div className="grid gap-1 text-sm text-muted-foreground">
                                        {data.taxes?.map((tax) => (
                                            <div key={tax.id} className="flex justify-between">
                                                <span>
                                                    {tax.tax_name} ({tax.rate}%)
                                                </span>
                                                <span>{money(tax.tax_amount ?? 0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="mb-2 text-sm font-medium">Payments</h4>
                                {(data.payments?.length ?? 0) === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nothing was tendered against this sale.</p>
                                ) : (
                                    <div className="grid gap-1 text-sm">
                                        {data.payments?.map((payment) => (
                                            <div key={payment.id} className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    {payment.payment_method?.name ?? 'Payment'}
                                                    {payment.reference_number && ` (${payment.reference_number})`}
                                                </span>
                                                <span>{money(payment.amount)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between border-t pt-2 font-medium">
                                            <span>Paid</span>
                                            <span>{money(data.amount_paid)}</span>
                                        </div>
                                        {Number(data.amount_due) > 0 && (
                                            <div className="flex justify-between text-amber-600 dark:text-amber-500">
                                                <span>Still owing</span>
                                                <span>{money(data.amount_due)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {data.status === 'void' && (
                                <Badge variant="destructive" className="w-fit">
                                    Voided &mdash; the stock was returned
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
