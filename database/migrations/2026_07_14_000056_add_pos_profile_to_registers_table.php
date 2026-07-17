<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Point a register at its POS profile. Nullable: a register without a profile
     * falls back to its company's default profile, so an unconfigured terminal is
     * still usable rather than broken.
     */
    public function up(): void
    {
        Schema::table('registers', function (Blueprint $table) {
            $table->foreignUuid('pos_profile_id')->nullable()->after('branch_id')
                ->constrained('pos_profiles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('registers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pos_profile_id');
        });
    }
};
