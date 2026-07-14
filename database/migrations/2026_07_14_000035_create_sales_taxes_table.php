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
        Schema::create('sales_taxes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_id')->constrained('sales');
            $table->foreignUuid('sales_detail_id')->nullable()->constrained('sales_details')->nullOnDelete();
            $table->foreignUuid('tax_id')->constrained('taxes');
            $table->string('tax_name', 100)->nullable();
            $table->decimal('rate', 6, 3)->nullable();
            $table->decimal('taxable_amount', 14, 2)->nullable();
            $table->decimal('tax_amount', 14, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_taxes');
    }
};
