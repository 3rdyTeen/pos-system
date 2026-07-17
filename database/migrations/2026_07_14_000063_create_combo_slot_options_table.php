<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A product that may fill a combo slot.
     */
    public function up(): void
    {
        Schema::create('combo_slot_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('combo_slot_id')->constrained('combo_slots')->cascadeOnDelete();

            // The real product handed over, and whose stock is deducted.
            $table->foreignUuid('product_id')->constrained('products');

            // Swap surcharge: an iced tea instead of the house cola might be +15.00.
            $table->decimal('price_delta', 14, 2)->default(0);

            // What the slot resolves to when the cashier does not choose.
            $table->boolean('is_default')->default(false);

            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->unique(['combo_slot_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('combo_slot_options');
    }
};
