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
        Schema::create('customer_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('loyalty_account_id')->constrained('loyalty_accounts');
            $table->foreignUuid('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->decimal('points_earned', 14, 2)->default(0);
            $table->decimal('points_redeemed', 14, 2)->default(0);
            $table->enum('transaction_type', ['earn', 'redeem', 'expire', 'adjustment']);
            $table->decimal('balance_after', 14, 2)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_points');
    }
};
