<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * stock_movements.reference_id is a plain uuid rather than a foreign key, so it
     * carries no index. Voiding a sale looks its movements up by (reference_type,
     * reference_id) to reverse them, which would table-scan a table that grows with
     * every line of every sale.
     */
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex(['reference_type', 'reference_id']);
        });
    }
};
