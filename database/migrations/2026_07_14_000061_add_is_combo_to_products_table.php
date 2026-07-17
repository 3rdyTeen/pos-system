<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mark a product as a combo meal.
     *
     * A combo is a product rather than a separate entity because it is sold like
     * one: it has a price, a tax, a barcode and a tile on the terminal. What makes
     * it different is that it has no stock of its own — its slots resolve to real
     * products, and those are what get deducted.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_combo')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('is_combo');
        });
    }
};
