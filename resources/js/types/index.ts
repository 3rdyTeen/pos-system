import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    /** Flat list of granted permission codes, e.g. "inventory.view". */
    permissions: string[];
}

/** A node in the dynamic, DB-driven navigation tree (shared via Inertia). */
export interface NavNode {
    id: string;
    name: string;
    url: string;
    icon: string | null;
    children: NavNode[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    navigation: NavNode[];
    [key: string]: unknown;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

/** Laravel API resource collection (paginated) response shape. */
export interface Paginated<T> {
    data: T[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number | null;
        to: number | null;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    is_enabled: boolean;
    users_count?: number;
    created_at: string;
    updated_at: string;
}

/** Minimal role reference used by selection inputs. */
export interface RoleOption {
    id: string;
    name: string;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    profile_image_url: string | null;
    is_enabled: boolean;
    role_id: string | null;
    role: {
        id: string;
        name: string;
        is_enabled: boolean;
    } | null;
    created_at: string;
    updated_at: string;
}

export type StatusFilter = 'all' | 'enabled' | 'disabled';
export type SortDirection = 'asc' | 'desc';

export interface RoleFilters {
    search: string;
    status: StatusFilter;
    sort: string;
    direction: SortDirection;
    page: number;
}

export interface UserFilters {
    search: string;
    status: StatusFilter;
    role_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export interface Module {
    id: string;
    name: string;
    code: string;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: string;
    name: string;
    code: string;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

/** Minimal reference used by selection inputs. */
export interface ModuleOption {
    id: string;
    name: string;
    code: string;
}

export interface Navigation {
    id: string;
    module_id: string;
    parent_id: string | null;
    name: string;
    code: string;
    icon: string | null;
    url: string;
    order: number;
    module?: { id: string; name: string; code: string };
    parent?: { id: string; name: string } | null;
    created_at: string;
    updated_at: string;
}

export interface ModuleFilters {
    search: string;
    status: StatusFilter;
    sort: string;
    direction: SortDirection;
    page: number;
}

export type PermissionFilters = ModuleFilters;

export interface NavigationFilters {
    search: string;
    module_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/** Role "Manage Permissions" matrix (per enabled module + its enabled permissions). */
export interface RolePermissionMatrixPermission {
    permission_id: string;
    name: string;
    code: string;
    generated_code: string;
    granted: boolean;
}

export interface RolePermissionMatrixModule {
    module_id: string;
    name: string;
    code: string;
    granted: boolean;
    permissions: RolePermissionMatrixPermission[];
}

/* -------------------------------------------------------------------------- */
/* Organization: Companies, Branches, Registers                               */
/* -------------------------------------------------------------------------- */

export type CompanyStatus = 'active' | 'inactive' | 'suspended';

export interface Company {
    id: string;
    name: string;
    legal_name: string | null;
    tax_id: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    logo_url: string | null;
    default_currency: string | null;
    timezone: string | null;
    status: CompanyStatus;
    branches_count?: number;
    created_at: string;
    updated_at: string;
}

/** Minimal company reference used by selection inputs. */
export interface CompanyOption {
    id: string;
    name: string;
}

export interface CompanyFilters {
    search: string;
    status: CompanyStatus | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export type BranchStatus = 'active' | 'inactive';

export interface Branch {
    id: string;
    company_id: string;
    company?: { id: string; name: string } | null;
    name: string;
    code: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    is_main_branch: boolean;
    status: BranchStatus;
    created_at: string;
    updated_at: string;
}

/** Minimal branch reference used by selection inputs. */
export interface BranchOption {
    id: string;
    name: string;
    company_id: string;
}

export interface BranchFilters {
    search: string;
    status: BranchStatus | 'all';
    company_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export type RegisterStatus = 'open' | 'closed' | 'maintenance';

export interface Register {
    id: string;
    branch_id: string;
    branch?: { id: string; name: string } | null;
    name: string;
    code: string | null;
    ip_address: string | null;
    status: RegisterStatus;
    created_at: string;
    updated_at: string;
}

export interface RegisterFilters {
    search: string;
    status: RegisterStatus | 'all';
    branch_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/* -------------------------------------------------------------------------- */
/* System Settings: Taxes, Units, Payment Methods, Currencies                 */
/* -------------------------------------------------------------------------- */

export type CurrencyStatus = 'active' | 'inactive';

export interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string | null;
    exchange_rate: string;
    is_base: boolean;
    status: CurrencyStatus;
    created_at: string;
    updated_at: string;
}

export interface CurrencyFilters {
    search: string;
    status: CurrencyStatus | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export type TaxType = 'sales' | 'purchase' | 'both';
export type TaxStatus = 'active' | 'inactive';

export interface Tax {
    id: string;
    company_id: string;
    company?: { id: string; name: string } | null;
    name: string;
    rate: string;
    type: TaxType;
    is_inclusive: boolean;
    status: TaxStatus;
    created_at: string;
    updated_at: string;
}

export interface TaxFilters {
    search: string;
    status: TaxStatus | 'all';
    company_id: string | 'all';
    type: TaxType | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export interface Unit {
    id: string;
    company_id: string;
    company?: { id: string; name: string } | null;
    name: string;
    abbreviation: string;
    base_unit_id: string | null;
    base_unit?: { id: string; name: string } | null;
    conversion_factor: string;
    created_at: string;
    updated_at: string;
}

/** Minimal unit reference used by selection inputs (e.g. the base-unit dropdown). */
export interface UnitOption {
    id: string;
    name: string;
    abbreviation: string;
    company_id: string;
}

export interface UnitFilters {
    search: string;
    company_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export interface PaymentMethod {
    id: string;
    company_id: string;
    company?: { id: string; name: string } | null;
    name: string;
    type: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PaymentMethodFilters {
    search: string;
    company_id: string | 'all';
    is_active: 'all' | 'active' | 'inactive';
    sort: string;
    direction: SortDirection;
    page: number;
}

/** Minimal tax reference used by selection inputs (e.g. the product tax dropdown). */
export interface TaxOption {
    id: string;
    name: string;
    rate: string;
    company_id: string;
}

/* -------------------------------------------------------------------------- */
/* Catalog: Products, Product Categories                                      */
/* -------------------------------------------------------------------------- */

export type ProductCategoryStatus = 'active' | 'inactive';

export interface ProductCategory {
    id: string;
    company_id: string;
    company?: { id: string; name: string } | null;
    parent_id: string | null;
    parent?: { id: string; name: string } | null;
    name: string;
    slug: string | null;
    description: string | null;
    image_url: string | null;
    status: ProductCategoryStatus;
    created_at: string;
    updated_at: string;
}

/** Minimal category reference used by selection inputs. */
export interface ProductCategoryOption {
    id: string;
    name: string;
    company_id: string;
}

export interface ProductCategoryFilters {
    search: string;
    status: ProductCategoryStatus | 'all';
    company_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export interface Product {
    id: string;
    company_id: string;
    company?: { id: string; name: string } | null;
    category_id: string | null;
    category?: { id: string; name: string } | null;
    name: string;
    sku: string | null;
    description: string | null;
    brand: string | null;
    base_unit_id: string | null;
    base_unit?: { id: string; name: string } | null;
    tax_id: string | null;
    tax?: { id: string; name: string } | null;
    cost_price: string;
    selling_price: string;
    reorder_level: string;
    is_active: boolean;
    /** A combo has no stock of its own; its components are what get deducted. */
    is_combo: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductFilters {
    search: string;
    status: 'all' | 'active' | 'inactive';
    company_id: string | 'all';
    category_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/* Per-product sub-entities (managed inline in the product sheet, and on the product detail page). */

export interface ProductVariant {
    id: string;
    product_id: string;
    variant_name: string;
    sku: string | null;
    attributes: Record<string, string>;
    cost_price: string;
    selling_price: string;
    created_at: string;
    updated_at: string;
}

export interface ProductUnit {
    id: string;
    product_id: string;
    unit_id: string;
    unit?: { id: string; name: string; abbreviation: string } | null;
    conversion_factor: string;
    is_base_unit: boolean;
}

export interface ProductBarcode {
    id: string;
    product_id: string;
    product_variant_id: string | null;
    variant?: { id: string; name: string } | null;
    product_unit_id: string | null;
    unit?: { id: string; name: string } | null;
    barcode: string;
    is_primary: boolean;
}

/* Draft rows for the product sheet, where sub-entities are edited inline alongside
   the product itself. A draft has no server id until it is saved, so rows are
   identified by a client-generated `key` and barcodes reference their variant/unit
   by that key. The keys are resolved to real ids at submit time (see useSaveProduct). */

export interface DraftRow {
    key: string;
    id: string | null;
}

export interface AttributeRow {
    key: string;
    value: string;
}

export interface VariantDraft extends DraftRow {
    variant_name: string;
    sku: string;
    attributes: AttributeRow[];
    cost_price: string;
    selling_price: string;
}

export interface UnitDraft extends DraftRow {
    unit_id: string;
    conversion_factor: string;
    is_base_unit: boolean;
}

export interface BarcodeDraft extends DraftRow {
    barcode: string;
    variant_key: string | null;
    unit_key: string | null;
    is_primary: boolean;
}

export interface RemovedIds {
    variants: string[];
    units: string[];
    barcodes: string[];
}

/* Suppliers */

export type SupplierStatus = 'active' | 'inactive';

export interface Supplier {
    id: string;
    company_id: string;
    company?: { id: string; name: string } | null;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    tax_id: string | null;
    status: SupplierStatus;
    created_at: string;
    updated_at: string;
}

export interface SupplierOption {
    id: string;
    name: string;
    company_id: string;
}

export interface SupplierFilters {
    search: string;
    status: SupplierStatus | 'all';
    company_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/* Customers */

export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
    id: string;
    company_id: string;
    company?: { id: string; name: string } | null;
    customer_group_id: string | null;
    group?: { id: string; name: string } | null;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    tax_id: string | null;
    credit_limit: string;
    status: CustomerStatus;
    created_at: string;
    updated_at: string;
}

export interface CustomerOption {
    id: string;
    name: string;
    company_id: string;
}

/** Customer groups are read-only for now — they only back the customer form dropdown. */
export interface CustomerGroupOption {
    id: string;
    name: string;
    company_id: string;
    discount_percentage: string;
}

export interface CustomerFilters {
    search: string;
    status: CustomerStatus | 'all';
    company_id: string | 'all';
    customer_group_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/* Inventory */

export interface ProductOption {
    id: string;
    name: string;
    sku: string | null;
    company_id: string;
    is_combo: boolean;
}

export type WarehouseStatus = 'active' | 'inactive';

export interface Warehouse {
    id: string;
    branch_id: string;
    branch?: { id: string; name: string; company_id: string } | null;
    name: string;
    code: string | null;
    address: string | null;
    is_default: boolean;
    status: WarehouseStatus;
    created_at: string;
    updated_at: string;
}

export interface WarehouseOption {
    id: string;
    name: string;
    code: string | null;
    branch_id: string;
}

export interface WarehouseFilters {
    search: string;
    status: WarehouseStatus | 'all';
    branch_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/**
 * Derived stock level for a product in a warehouse. Read-only: rows are maintained
 * by stock postings, and `quantity_available` is a generated column.
 */
export interface InventoryBalance {
    id: string;
    warehouse_id: string;
    warehouse?: { id: string; name: string } | null;
    product_id: string;
    product?: { id: string; name: string; sku: string | null; reorder_level: string } | null;
    product_variant_id: string | null;
    variant?: { id: string; variant_name: string } | null;
    quantity_on_hand: string;
    quantity_reserved: string;
    quantity_available: string;
    average_cost: string;
    last_counted_at: string | null;
    updated_at: string | null;
}

export interface InventoryBalanceFilters {
    search: string;
    warehouse_id: string | 'all';
    stock: 'all' | 'in_stock' | 'out_of_stock';
    sort: string;
    direction: SortDirection;
    page: number;
}

export type StockAdjustmentStatus = 'draft' | 'approved' | 'cancelled';

export interface StockAdjustmentDetail {
    id: string;
    stock_adjustment_id: string;
    product_id: string;
    product?: { id: string; name: string; sku: string | null } | null;
    product_variant_id: string | null;
    variant?: { id: string; variant_name: string } | null;
    system_qty: string;
    counted_qty: string;
    /** Generated column: counted_qty - system_qty. */
    difference: string;
    unit_cost: string;
}

export interface StockAdjustment {
    id: string;
    warehouse_id: string;
    warehouse?: { id: string; name: string } | null;
    adjustment_number: string;
    reason: string | null;
    status: StockAdjustmentStatus;
    adjusted_by: string | null;
    adjusted_by_user?: { id: string; name: string } | null;
    adjustment_date: string | null;
    notes: string | null;
    details_count?: number;
    details?: StockAdjustmentDetail[];
    created_at: string;
}

export interface StockAdjustmentFilters {
    search: string;
    status: StockAdjustmentStatus | 'all';
    warehouse_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export type StockTransferStatus = 'draft' | 'in_transit' | 'completed' | 'cancelled';

export interface StockTransferDetail {
    id: string;
    stock_transfer_id: string;
    product_id: string;
    product?: { id: string; name: string; sku: string | null } | null;
    product_variant_id: string | null;
    variant?: { id: string; variant_name: string } | null;
    quantity: string;
    unit_cost: string;
}

export interface StockTransfer {
    id: string;
    from_warehouse_id: string;
    from_warehouse?: { id: string; name: string } | null;
    to_warehouse_id: string;
    to_warehouse?: { id: string; name: string } | null;
    transfer_number: string;
    status: StockTransferStatus;
    requested_by: string | null;
    requested_by_user?: { id: string; name: string } | null;
    approved_by: string | null;
    transfer_date: string | null;
    notes: string | null;
    details_count?: number;
    details?: StockTransferDetail[];
    created_at: string;
    updated_at: string;
}

export interface StockTransferFilters {
    search: string;
    status: StockTransferStatus | 'all';
    warehouse_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/** Draft line for the adjustment/transfer sheets, keyed by client id like the product sheet. */
export interface StockLineDraft {
    key: string;
    product_id: string;
    product_variant_id: string | null;
    /** Adjustments only. */
    system_qty: string;
    counted_qty: string;
    /** Transfers only. */
    quantity: string;
    unit_cost: string;
}

/* Purchasing */

export interface PaymentMethodOption {
    id: string;
    name: string;
    type: string | null;
    company_id: string;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseDetail {
    id: string;
    purchase_order_id: string;
    product_id: string;
    product?: { id: string; name: string; sku: string | null } | null;
    product_variant_id: string | null;
    variant?: { id: string; variant_name: string } | null;
    quantity: string;
    unit_cost: string;
    tax_amount: string;
    discount_amount: string;
    /** Computed server-side: quantity x unit_cost + tax - discount. */
    line_total: string;
    received_qty: string;
}

export interface PurchaseOrder {
    id: string;
    branch_id: string;
    branch?: { id: string; name: string } | null;
    warehouse_id: string;
    warehouse?: { id: string; name: string } | null;
    supplier_id: string;
    supplier?: { id: string; name: string } | null;
    user_id: string;
    po_number: string;
    order_date: string | null;
    expected_date: string | null;
    /** All four totals are computed server-side from the lines. */
    subtotal: string;
    tax_total: string;
    discount_total: string;
    grand_total: string;
    status: PurchaseOrderStatus;
    notes: string | null;
    details_count?: number;
    details?: PurchaseDetail[];
    payments?: PurchasePayment[];
    paid_total?: string;
    balance?: string;
    created_at: string;
    updated_at: string;
}

export interface PurchaseOrderOption {
    id: string;
    po_number: string;
    supplier_id: string;
    branch_id: string;
}

export interface PurchaseOrderFilters {
    search: string;
    status: PurchaseOrderStatus | 'all';
    supplier_id: string | 'all';
    warehouse_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

export interface PurchasePayment {
    id: string;
    purchase_order_id: string;
    payment_method_id: string;
    payment_method?: { id: string; name: string } | null;
    amount: string;
    reference_number: string | null;
    paid_at: string | null;
    paid_by: string | null;
    paid_by_user?: { id: string; name: string } | null;
    created_at: string;
}

export type PurchaseReturnStatus = 'pending' | 'completed' | 'cancelled';

export interface PurchaseReturnDetail {
    id: string;
    purchase_return_id: string;
    purchase_detail_id: string | null;
    product_id: string;
    product?: { id: string; name: string; sku: string | null } | null;
    product_variant_id: string | null;
    variant?: { id: string; variant_name: string } | null;
    quantity: string;
    unit_cost: string;
    /** Computed server-side: quantity x unit_cost. */
    line_total: string;
}

export interface PurchaseReturn {
    id: string;
    purchase_order_id: string;
    purchase_order?: { id: string; po_number: string; supplier?: { id: string; name: string } | null } | null;
    branch_id: string;
    branch?: { id: string; name: string } | null;
    user_id: string;
    user?: { id: string; name: string } | null;
    return_number: string;
    return_date: string | null;
    reason: string | null;
    /** Computed server-side from the lines. */
    total_amount: string;
    status: PurchaseReturnStatus;
    details_count?: number;
    details?: PurchaseReturnDetail[];
    created_at: string;
}

export interface PurchaseReturnFilters {
    search: string;
    status: PurchaseReturnStatus | 'all';
    purchase_order_id: string | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/** Draft line for the purchase order sheet. */
export interface PurchaseLineDraft {
    key: string;
    product_id: string;
    product_variant_id: string | null;
    quantity: string;
    unit_cost: string;
    tax_amount: string;
    discount_amount: string;
}

/** Draft line for the purchase return sheet. */
export interface PurchaseReturnLineDraft {
    key: string;
    purchase_detail_id: string | null;
    product_id: string;
    product_variant_id: string | null;
    quantity: string;
    unit_cost: string;
}

/* -------------------------------------------------------------------------- */
/* Sales: POS terminal, Sales, Returns, Terminal profiles                     */
/* -------------------------------------------------------------------------- */

export type SaleStatus = 'draft' | 'completed' | 'void' | 'held';
export type SalePaymentStatus = 'unpaid' | 'partial' | 'paid';

/** How the cashier finds a product. Groceries scan, fast food taps tiles. */
export type PickingMode = 'barcode' | 'tiles' | 'hybrid';
export type OrderType = 'retail' | 'dine_in' | 'takeout' | 'delivery';

export interface SalesDetail {
    id: string;
    sale_id: string;
    product_id: string;
    product?: { id: string; name: string; sku: string | null } | null;
    product_variant_id: string | null;
    variant?: { id: string; name: string } | null;
    unit_id: string | null;
    unit?: { id: string; name: string } | null;
    quantity: string;
    /** All-in: the catalogue price plus every modifier and component surcharge. */
    unit_price: string;
    discount_amount: string;
    tax_amount: string;
    /** Computed server-side: quantity x unit_price - discount, plus tax when the tax is not inclusive. */
    line_total: string;
    /** The choices made against this line, as they were sold. */
    modifiers?: SoldModifier[];
    /** What a combo line resolved to. Empty for a plain product. */
    components?: SoldComponent[];
}

export interface SoldModifier {
    id: string;
    modifier_group_id: string | null;
    modifier_option_id?: string | null;
    group_name: string | null;
    name: string;
    price_delta: string;
    product_id: string | null;
}

export interface SoldComponent {
    id: string;
    combo_slot_id: string | null;
    slot_option_id: string | null;
    slot_name: string | null;
    name: string;
    product_id: string;
    quantity: string;
    price_delta: string;
}

export interface SalePayment {
    id: string;
    sale_id: string;
    payment_method_id: string;
    payment_method?: { id: string; name: string; type: string | null } | null;
    amount: string;
    reference_number: string | null;
    paid_at: string | null;
    received_by: string | null;
    created_at: string | null;
}

export interface SaleTax {
    id: string;
    sale_id: string;
    sales_detail_id: string | null;
    tax_id: string;
    /** Copied off the tax when the sale was rung up, so a later rate change does not rewrite history. */
    tax_name: string | null;
    rate: string | null;
    taxable_amount: string | null;
    tax_amount: string | null;
}

export interface Sale {
    id: string;
    branch_id: string;
    branch?: { id: string; name: string } | null;
    warehouse_id: string | null;
    warehouse?: { id: string; name: string } | null;
    register_id: string | null;
    register?: { id: string; name: string } | null;
    shift_id: string | null;
    customer_id: string | null;
    customer?: { id: string; name: string } | null;
    user_id: string;
    user?: { id: string; name: string } | null;
    sale_number: string;
    sale_date: string | null;
    order_type: string | null;
    subtotal: string;
    discount_total: string;
    tax_total: string;
    grand_total: string;
    amount_paid: string;
    amount_due: string;
    status: SaleStatus;
    payment_status: SalePaymentStatus;
    notes: string | null;
    details_count?: number;
    details?: SalesDetail[];
    payments?: SalePayment[];
    taxes?: SaleTax[];
    created_at: string | null;
    updated_at: string | null;
}

export interface SaleFilters {
    search: string;
    status: SaleStatus | 'all';
    payment_status: SalePaymentStatus | 'all';
    register_id: string | 'all';
    from: string;
    to: string;
    sort: string;
    direction: SortDirection;
    page: number;
}

export interface SaleOption {
    id: string;
    sale_number: string;
    customer_id: string | null;
    branch_id: string;
    grand_total: string;
    sale_date: string | null;
}

/* Sales returns */

export type SalesReturnStatus = 'pending' | 'completed' | 'cancelled';

export interface SalesReturnDetail {
    id: string;
    sales_return_id: string;
    sales_detail_id: string | null;
    product_id: string;
    product?: { id: string; name: string; sku: string | null } | null;
    product_variant_id: string | null;
    quantity: string;
    /** Taken from the original sale line: a refund pays back what was charged. */
    unit_price: string;
    line_total: string;
}

export interface SalesReturn {
    id: string;
    sale_id: string;
    sale?: { id: string; sale_number: string; customer?: { id: string; name: string } | null } | null;
    branch_id: string;
    branch?: { id: string; name: string } | null;
    user_id: string;
    user?: { id: string; name: string } | null;
    return_number: string;
    return_date: string | null;
    reason: string | null;
    /** Computed server-side from the original sale's prices. */
    total_amount: string;
    refund_method: string | null;
    status: SalesReturnStatus;
    details_count?: number;
    details?: SalesReturnDetail[];
    created_at: string | null;
}

export interface SalesReturnFilters {
    search: string;
    status: SalesReturnStatus | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/* Shifts */

export type ShiftStatus = 'open' | 'closed';

export interface Shift {
    id: string;
    register_id: string;
    register?: { id: string; name: string } | null;
    user_id: string;
    user?: { id: string; name: string } | null;
    opening_balance: string;
    closing_balance: string | null;
    opened_at: string | null;
    closed_at: string | null;
    status: ShiftStatus;
    notes: string | null;
}

/**
 * Till figures for a shift. Computed rather than stored, so they arrive alongside
 * the shift rather than on it.
 */
export interface ShiftReconciliation {
    opening_balance: number;
    cash_taken: number;
    other_taken: number;
    expected_cash: number;
    counted_cash: number | null;
    /** Positive means the drawer is over, negative means it is short. Null until counted. */
    variance: number | null;
    sales_count: number;
}

/* Terminal profiles */

export interface PosProfile {
    id: string;
    company_id: string;
    company?: { id: string; name: string } | null;
    name: string;
    code: string | null;
    picking_mode: PickingMode;
    order_types: OrderType[];
    default_order_type: OrderType | null;
    quick_tender: number[] | null;
    require_customer: boolean;
    allow_held_orders: boolean;
    allow_negative_stock: boolean;
    is_default: boolean;
    status: 'active' | 'inactive';
    registers_count?: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface PosProfileFilters {
    search: string;
    status: 'active' | 'inactive' | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/**
 * The effective terminal config, always fully populated — an unconfigured register
 * still resolves to workable defaults rather than to nothing.
 */
export interface PosProfileConfig {
    id: string | null;
    name: string;
    picking_mode: PickingMode;
    order_types: OrderType[];
    default_order_type: OrderType;
    quick_tender: number[];
    require_customer: boolean;
    allow_held_orders: boolean;
    allow_negative_stock: boolean;
}

/** A product as the till sees it: what it costs, what tax it carries, what is left. */
export interface PosProduct {
    id: string;
    name: string;
    sku: string | null;
    category_id: string | null;
    unit_price: string;
    unit_id: string | null;
    unit_name: string | null;
    tax_rate: string | null;
    tax_inclusive: boolean;
    /** Null when no warehouse was named, which reads as "not counted" rather than zero. */
    stock_on_hand: string | null;
    is_combo: boolean;
    /** Whether tapping this must open the configurator rather than go straight to the cart. */
    needs_configuration: boolean;
    product_variant_id?: string | null;
    variant_name?: string | null;
}

/**
 * The company's capability switches, as the terminal consumes them. These are the
 * feature-control flags in the shape the till needs — what to show, not the dotted
 * storage keys. Toggling them on the control page reshapes the terminal.
 */
export interface PosFlags {
    modifiers_enabled: boolean;
    combos_enabled: boolean;
    allow_price_override: boolean;
    allow_line_discount: boolean;
    show_stock: boolean;
}

export interface PosContext {
    register: { id: string; name: string; branch_id: string; branch: { id: string; name: string } | null } | null;
    /** The warehouse the sale will draw from — what the tiles' stock counts refer to. */
    warehouse_id: string | null;
    profile: PosProfileConfig;
    flags: PosFlags;
    shift: Shift | null;
    registers: { id: string; name: string; branch_id: string }[];
    payment_methods: { id: string; name: string; type: string | null }[];
    categories: { id: string; name: string }[];
}

/** A cart line, held in client state until the sale is sent. */
export interface CartLine {
    uid: string;
    product_id: string;
    product_variant_id: string | null;
    unit_id: string | null;
    name: string;
    quantity: string;
    unit_price: string;
    discount_amount: string;
    tax_rate: string | null;
    tax_inclusive: boolean;
    stock_on_hand: string | null;
    /** Choices made against this line. Only the ids are sent; the server prices them. */
    modifiers: CartModifier[];
    /** Which product fills each combo slot. Empty for a plain product. */
    components: CartComponent[];
}

export interface CartModifier {
    option_id: string;
    group_id: string;
    group_name: string;
    name: string;
    price_delta: string;
}

export interface CartComponent {
    slot_option_id: string;
    slot_id: string;
    slot_name: string;
    name: string;
    price_delta: string;
}

/* -------------------------------------------------------------------------- */
/* Feature controls, modifiers and combos                                     */
/* -------------------------------------------------------------------------- */

/**
 * A company capability switch. Distinct from module permissions (who may open a
 * page) and from POS profiles (how one till behaves).
 */
export interface FeatureFlag {
    key: string;
    value: boolean;
    label: string;
    description: string;
    group: string;
    default: boolean;
}

export interface FeatureControls {
    company_id: string | null;
    flags: FeatureFlag[];
    companies: { id: string; name: string }[];
}

export type ModifierSelectionType = 'single' | 'multiple';

export interface ModifierOption {
    id: string;
    name: string;
    price_delta: string;
    /** When set, choosing this option deducts that product's stock. */
    product_id: string | null;
    is_default: boolean;
    sort_order: number;
}

export interface ModifierGroup {
    id: string;
    company_id: string;
    name: string;
    selection_type: ModifierSelectionType;
    is_required: boolean;
    min_select: number;
    max_select: number | null;
    /** The bounds the server actually enforces, after the single/required rules. */
    effective_min: number;
    effective_max: number | null;
    sort_order: number;
    status: 'active' | 'inactive';
    options_count?: number;
    products_count?: number;
    options?: ModifierOption[];
    product_ids?: string[];
    created_at: string | null;
}

export interface ModifierGroupFilters {
    search: string;
    status: 'active' | 'inactive' | 'all';
    sort: string;
    direction: SortDirection;
    page: number;
}

/** Draft option row for the modifier group sheet. */
export interface ModifierOptionDraft {
    key: string;
    id: string | null;
    name: string;
    price_delta: string;
    product_id: string | null;
    is_default: boolean;
}

export interface ComboSlotOption {
    id: string;
    product_id: string;
    product_name: string | null;
    price_delta: string;
    is_default: boolean;
}

export interface ComboSlot {
    id: string;
    name: string;
    quantity: string;
    /** When false the slot is fixed and the terminal offers no choice. */
    is_swappable: boolean;
    sort_order: number;
    options: ComboSlotOption[];
}

/** Draft slot for the product page's combo editor. */
export interface ComboSlotDraft {
    key: string;
    name: string;
    quantity: string;
    is_swappable: boolean;
    options: { key: string; product_id: string; price_delta: string; is_default: boolean }[];
}

/** What the terminal needs to configure one product. */
export interface PosConfiguration {
    product_id: string;
    is_combo: boolean;
    groups: {
        id: string;
        name: string;
        selection_type: ModifierSelectionType;
        is_required: boolean;
        min_select: number;
        max_select: number | null;
        options: { id: string; name: string; price_delta: string; is_default: boolean }[];
    }[];
    slots: {
        id: string;
        name: string;
        quantity: string;
        is_swappable: boolean;
        options: { id: string; product_id: string; name: string; price_delta: string; is_default: boolean }[];
    }[];
}
