<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventory_balances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('warehouse_id')->constrained('warehouses');
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->decimal('quantity_on_hand', 14, 4)->default(0);
            $table->decimal('quantity_reserved', 14, 4)->default(0);
            $table->decimal('quantity_available', 14, 4)->storedAs('quantity_on_hand - quantity_reserved');
            $table->decimal('average_cost', 14, 4)->default(0);
            $table->timestamp('last_counted_at')->nullable();
            $table->timestamp('updated_at')->nullable()->useCurrent();

            $table->unique(['warehouse_id', 'product_id', 'product_variant_id'], 'inventory_balances_whs_prod_variant_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_balances');
    }
};
