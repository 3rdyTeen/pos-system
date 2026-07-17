<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The sales table was created before the terminal existed and is missing three
     * things the POS needs:
     *
     * - warehouse_id: stock lives per warehouse, but a sale only knew its branch.
     *   Without this there is no way to say which stock a sale consumed.
     * - shift_id: takings could not be attributed to a drawer session, so a till
     *   could never be reconciled.
     * - order_type: what separates a dine-in from a takeout on the same terminal.
     *
     * All three are nullable so existing rows (and non-terminal sales) stay valid.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignUuid('warehouse_id')->nullable()->after('branch_id')
                ->constrained('warehouses')->nullOnDelete();
            $table->foreignUuid('shift_id')->nullable()->after('register_id')
                ->constrained('shifts')->nullOnDelete();
            $table->string('order_type', 30)->nullable()->after('sale_date');

            // The history page's default view is one branch's sales newest-first.
            $table->index(['branch_id', 'sale_date']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        // InnoDB requires an index on a foreign key column, and it satisfies the
        // pre-existing branch_id constraint with the composite index added above —
        // it is the only index covering that column. Dropping it outright fails
        // with errno 1553, so put a standalone index back first.
        Schema::table('sales', function (Blueprint $table) {
            $table->index('branch_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'sale_date']);
            $table->dropIndex(['status']);

            $table->dropConstrainedForeignId('warehouse_id');
            $table->dropConstrainedForeignId('shift_id');
            $table->dropColumn('order_type');
        });
    }
};
