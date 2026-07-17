<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A reusable set of choices offered against a product at the till: "Size",
     * "Add-ons", "Sugar level".
     *
     * Deliberately distinct from product_variants. A variant is its own sellable SKU
     * with its own price and stock (a Red Large T-shirt). A modifier is a per-line
     * choice that nudges the price of the thing being sold (extra cheese, no onions)
     * and never has stock of its own.
     */
    public function up(): void
    {
        Schema::create('modifier_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies');
            $table->string('name', 100);

            // `single` renders as radio buttons, `multiple` as checkboxes.
            $table->enum('selection_type', ['single', 'multiple'])->default('single');

            // How many options the cashier must pick. For `single` groups the terminal
            // enforces exactly one when required; for `multiple` these bound the range.
            // A null max means unlimited.
            $table->boolean('is_required')->default(false);
            $table->unsignedSmallInteger('min_select')->default(0);
            $table->unsignedSmallInteger('max_select')->nullable();

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modifier_groups');
    }
};
