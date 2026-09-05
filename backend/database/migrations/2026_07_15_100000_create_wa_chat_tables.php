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
        Schema::create('wa_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number')->unique();
            $table->string('customer_name')->nullable();
            $table->timestamp('ai_paused_until')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->integer('unread_count')->default(0);
            $table->timestamps();
        });

        Schema::create('wa_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wa_conversation_id')->constrained('wa_conversations')->onDelete('cascade');
            $table->string('message_id')->nullable()->unique();
            $table->enum('sender_type', ['customer', 'ai', 'admin'])->default('customer');
            $table->text('message');
            $table->string('status')->nullable(); // sent, delivered, read
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wa_messages');
        Schema::dropIfExists('wa_conversations');
    }
};
