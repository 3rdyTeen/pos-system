<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A component position within a combo: the "Drink" or the "Side" of a meal.
     *
     * The slot says what the meal is made of; combo_slot_options say what may fill it.
     */
    public function up(): void
    {
        Schema::create('combo_slots', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // The combo product this slot belongs to.
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name', 100);

            // How many of the chosen product the slot yields — two pieces of chicken,
            // one drink.
            $table->decimal('quantity', 14, 4)->default(1);

            // When false the slot is fixed: the customer gets the default and the
            // terminal offers no choice. A meal's burger is usually fixed while its
            // drink is not.
            $table->boolean('is_swappable')->default(true);

            $table->unsignedSmallInteger('sort_order')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('combo_slots');
    }
};
