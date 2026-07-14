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
        Schema::create('role_modules', function (Blueprint $table) {
            $table->foreignUuid('role_id')->constrained('roles')->cascadeOnDelete();
            $table->foreignUuid('module_id')->constrained('modules')->cascadeOnDelete();
            $table->timestamps();

            // Composite key: a plain pivot needs no surrogate id (and belongsToMany
            // attach() would not populate a uuid primary key).
            $table->primary(['role_id', 'module_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_modules');
    }
};
