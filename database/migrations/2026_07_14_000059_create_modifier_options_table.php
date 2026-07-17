<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One choice within a modifier group.
     */
    public function up(): void
    {
        Schema::create('modifier_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('modifier_group_id')->constrained('modifier_groups')->cascadeOnDelete();
            $table->string('name', 100);

            // Signed: "Large" might be +25.00 while "No cheese" could be -5.00.
            $table->decimal('price_delta', 14, 2)->default(0);

            // Optional link to a real product. When set, choosing this option deducts
            // that product's stock — so "extra cheese" can draw down cheese while
            // "no onions" stays a price-only note with nothing to deduct.
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();

            $table->boolean('is_default')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modifier_options');
    }
};
