/**
 * Saves a product together with its variants, units, and barcodes.
 *
 * The sub-entity endpoints are all product-scoped and one-row-per-request, so a
 * sheet that edits everything at once has to fan the work out into a sequence of
 * calls. Order matters:
 *
 *   1. the product, to get an id the children can hang off
 *   2. deletions
 *   3. variants and units, which barcodes reference
 *   4. barcodes, whose draft rows point at variants/units by client key
 *
 * This is not atomic — there is no nested endpoint behind it — so a failure part
 * way through leaves earlier writes in place. `progress` reports each write as it
 * lands so the caller can record the new ids and retry only what is left, rather
 * than duplicating what already succeeded.
 */

import { ApiError, ValidationErrors, api } from '@/lib/api';
import { AttributeRow, BarcodeDraft, Product, ProductBarcode, ProductUnit, ProductVariant, RemovedIds, UnitDraft, VariantDraft } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productBarcodeKeys } from './useProductBarcodes';
import { ProductPayload } from './useProductMutations';
import { productKeys } from './useProducts';
import { productUnitKeys } from './useProductUnits';
import { productVariantKeys } from './useProductVariants';

export type SaveScope = 'details' | 'variants' | 'units' | 'barcodes';
export type ChildScope = Exclude<SaveScope, 'details'>;

/**
 * A failed write, tagged with enough context for the sheet to point at the row
 * that caused it. Laravel returns flat keys (`barcode`, `sku`), which say nothing
 * about which of several rows was rejected.
 */
export class SaveProductError extends Error {
    constructor(
        public readonly scope: SaveScope,
        public readonly rowKey: string | null,
        public readonly errors: ValidationErrors,
        message: string,
    ) {
        super(message);
        this.name = 'SaveProductError';
    }
}

export interface SaveProductProgress {
    /** The product exists on the server now; a retry must update it, not create a second one. */
    productSaved: (id: string) => void;
    rowSaved: (scope: ChildScope, key: string, id: string) => void;
    rowRemoved: (scope: ChildScope, id: string) => void;
}

export interface SaveProductInput {
    /** Existing product id, or null to create. */
    productId: string | null;
    details: ProductPayload;
    variants: VariantDraft[];
    units: UnitDraft[];
    barcodes: BarcodeDraft[];
    removed: RemovedIds;
}

const toAttributeObject = (rows: AttributeRow[]): Record<string, string> =>
    rows.reduce<Record<string, string>>((acc, row) => {
        const key = row.key.trim();
        if (key) {
            acc[key] = row.value;
        }
        return acc;
    }, {});

function tag(error: unknown, scope: SaveScope, rowKey: string | null): SaveProductError {
    if (error instanceof ApiError) {
        return new SaveProductError(scope, rowKey, error.errors, error.message);
    }

    return new SaveProductError(scope, rowKey, {}, error instanceof Error ? error.message : 'Something went wrong.');
}

async function step<T>(scope: SaveScope, rowKey: string | null, run: () => Promise<T>): Promise<T> {
    try {
        return await run();
    } catch (error) {
        throw tag(error, scope, rowKey);
    }
}

async function saveProduct(input: SaveProductInput, progress: SaveProductProgress): Promise<string> {
    const { details, variants, units, barcodes, removed } = input;
    let productId = input.productId;

    if (productId) {
        const id = productId;
        await step('details', null, () => api.put<{ data: Product }>(`/api/products/${id}`, details));
    } else {
        const created = await step('details', null, () => api.post<{ data: Product }>('/api/products', details));
        productId = created.data.id;
        progress.productSaved(productId);
    }

    // Barcodes go first: the variant and unit FKs are nullOnDelete, so dropping a
    // variant before the barcode that points at it would quietly null the reference
    // instead of failing, leaving a barcode we meant to delete pointing at nothing.
    for (const id of removed.barcodes) {
        await step('barcodes', null, () => api.delete(`/api/product-barcodes/${id}`));
        progress.rowRemoved('barcodes', id);
    }

    for (const id of removed.variants) {
        await step('variants', null, () => api.delete(`/api/product-variants/${id}`));
        progress.rowRemoved('variants', id);
    }

    for (const id of removed.units) {
        await step('units', null, () => api.delete(`/api/product-units/${id}`));
        progress.rowRemoved('units', id);
    }

    // Client key -> server id, so barcode rows can resolve variants and units that
    // may not have existed when the user picked them.
    const variantIds = new Map<string, string>();
    const unitIds = new Map<string, string>();

    for (const row of variants) {
        const payload = {
            variant_name: row.variant_name,
            sku: row.sku,
            attributes: toAttributeObject(row.attributes),
            cost_price: row.cost_price,
            selling_price: row.selling_price,
        };

        const saved = await step('variants', row.key, () =>
            row.id
                ? api.put<{ data: ProductVariant }>(`/api/product-variants/${row.id}`, payload)
                : api.post<{ data: ProductVariant }>(`/api/products/${productId}/variants`, payload),
        );

        variantIds.set(row.key, saved.data.id);
        if (!row.id) {
            progress.rowSaved('variants', row.key, saved.data.id);
        }
    }

    for (const row of units) {
        const payload = {
            unit_id: row.unit_id,
            conversion_factor: row.conversion_factor,
            is_base_unit: row.is_base_unit,
        };

        const saved = await step('units', row.key, () =>
            row.id
                ? api.put<{ data: ProductUnit }>(`/api/product-units/${row.id}`, payload)
                : api.post<{ data: ProductUnit }>(`/api/products/${productId}/units`, payload),
        );

        unitIds.set(row.key, saved.data.id);
        if (!row.id) {
            progress.rowSaved('units', row.key, saved.data.id);
        }
    }

    for (const row of barcodes) {
        const payload = {
            barcode: row.barcode,
            product_variant_id: row.variant_key ? (variantIds.get(row.variant_key) ?? null) : null,
            product_unit_id: row.unit_key ? (unitIds.get(row.unit_key) ?? null) : null,
            is_primary: row.is_primary,
        };

        const saved = await step('barcodes', row.key, () =>
            row.id
                ? api.put<{ data: ProductBarcode }>(`/api/product-barcodes/${row.id}`, payload)
                : api.post<{ data: ProductBarcode }>(`/api/products/${productId}/barcodes`, payload),
        );

        if (!row.id) {
            progress.rowSaved('barcodes', row.key, saved.data.id);
        }
    }

    return productId;
}

export function useSaveProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ input, progress }: { input: SaveProductInput; progress: SaveProductProgress }) => saveProduct(input, progress),
        // onSettled, not onSuccess: a run that failed half way still wrote rows.
        onSettled: (savedId, _error, { input }) => {
            const productId = savedId ?? input.productId;

            queryClient.invalidateQueries({ queryKey: productKeys.all });

            if (productId) {
                queryClient.invalidateQueries({ queryKey: productVariantKeys.list(productId) });
                queryClient.invalidateQueries({ queryKey: productUnitKeys.list(productId) });
                queryClient.invalidateQueries({ queryKey: productBarcodeKeys.list(productId) });
            }
        },
    });
}
