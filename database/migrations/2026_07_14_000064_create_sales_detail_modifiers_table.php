<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A modifier as it was actually sold.
     *
     * The name and price are copied in rather than read through the option, for the
     * same reason sales_taxes copies its rate: renaming "Extra cheese" or repricing
     * it must not rewrite a receipt from last month. The option link is kept for
     * reporting but is nullable and may go away.
     */
    public function up(): void
    {
        Schema::create('sales_detail_modifiers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sales_detail_id')->constrained('sales_details')->cascadeOnDelete();
            $table->foreignUuid('modifier_option_id')->nullable()->constrained('modifier_options')->nullOnDelete();
            $table->foreignUuid('modifier_group_id')->nullable()->constrained('modifier_groups')->nullOnDelete();

            $table->string('group_name', 100)->nullable();
            $table->string('name', 100);
            $table->decimal('price_delta', 14, 2)->default(0);

            // The product whose stock this choice moved, when it had one.
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_detail_modifiers');
    }
};
