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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies');
            $table->foreignUuid('category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->string('name', 150);
            $table->string('sku', 50)->nullable()->unique();
            $table->text('description')->nullable();
            $table->string('brand', 100)->nullable();
            $table->foreignUuid('base_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignUuid('tax_id')->nullable()->constrained('taxes')->nullOnDelete();
            $table->decimal('cost_price', 14, 2)->default(0);
            $table->decimal('selling_price', 14, 2)->default(0);
            $table->decimal('reorder_level', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
