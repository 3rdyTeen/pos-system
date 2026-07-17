<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * What a combo line actually resolved to.
     *
     * A combo product has no stock of its own, so this is the record of which real
     * products went out of the door — it is what StockPostingService deducts against,
     * and the only way to know a month later that the meal went out with an iced tea
     * rather than a cola.
     */
    public function up(): void
    {
        Schema::create('sales_detail_components', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sales_detail_id')->constrained('sales_details')->cascadeOnDelete();
            $table->foreignUuid('combo_slot_id')->nullable()->constrained('combo_slots')->nullOnDelete();

            // Which option was picked, as opposed to what it resolved to. Needed to
            // restore a parked combo with the drink the customer actually chose, and
            // to report on how often each swap is taken. Nullable because the option
            // may be removed from the menu long after the sale.
            $table->foreignUuid('combo_slot_option_id')->nullable()->constrained('combo_slot_options')->nullOnDelete();

            // The product handed over. Not nullable: a component with no product is
            // stock that could never be accounted for.
            $table->foreignUuid('product_id')->constrained('products');

            $table->string('slot_name', 100)->nullable();
            $table->string('name', 100);

            // Per single combo, before the line's own quantity is applied.
            $table->decimal('quantity', 14, 4)->default(1);
            $table->decimal('price_delta', 14, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_detail_components');
    }
};
