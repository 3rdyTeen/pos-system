<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Which groups a product offers. Many-to-many so "Size" can be built once and
     * hung off every drink on the menu.
     */
    public function up(): void
    {
        Schema::create('product_modifier_groups', function (Blueprint $table) {
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('modifier_group_id')->constrained('modifier_groups')->cascadeOnDelete();

            // Per-product ordering: a burger may want Add-ons first, a drink Size first.
            $table->unsignedSmallInteger('sort_order')->default(0);

            // Composite key: a plain pivot needs no surrogate id (and belongsToMany
            // attach() would not populate a uuid primary key). Same reasoning as
            // role_modules.
            $table->primary(['product_id', 'modifier_group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_modifier_groups');
    }
};
