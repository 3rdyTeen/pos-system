<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A POS profile is the terminal's configuration: it is what lets one terminal
     * serve a grocery lane, a fast-food counter or a plain retail desk without a
     * code fork. Registers point at a profile; the terminal reads the profile and
     * adapts its picking mode, tender shortcuts and order types accordingly.
     */
    public function up(): void
    {
        Schema::create('pos_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies');
            $table->string('name', 100);
            $table->string('code', 30)->nullable()->unique();

            // How the cashier finds a product. Groceries scan, fast food taps tiles,
            // hybrid shows both and is the safe default for an unconfigured terminal.
            $table->enum('picking_mode', ['barcode', 'tiles', 'hybrid'])->default('hybrid');

            // Allowed order types, e.g. ["retail"] or ["dine_in","takeout","delivery"].
            $table->json('order_types');
            $table->string('default_order_type', 30)->nullable();

            // Cash denominations offered as one-tap tender buttons, e.g. [20,50,100].
            $table->json('quick_tender')->nullable();

            $table->boolean('require_customer')->default(false);
            $table->boolean('allow_held_orders')->default(true);

            // When true the terminal sells past zero on hand. Groceries and fast food
            // usually want this on (stock counts drift); controlled retail wants it off.
            $table->boolean('allow_negative_stock')->default(true);

            // Note: VAT-inclusive pricing is deliberately not configured here. Each
            // tax already carries its own `is_inclusive` flag, so a profile-level
            // copy would be a second source of truth that could contradict it.

            $table->boolean('is_default')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_profiles');
    }
};
