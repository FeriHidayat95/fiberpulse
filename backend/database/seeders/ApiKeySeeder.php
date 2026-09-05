<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Carbon\Carbon;
use App\Models\ApiKey;

class ApiKeySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $defaultKey = env('GEMINI_API_KEY', 'AIzaSy_MOCK_DEV_KEY_REPLACE_ME');

        $geminiKeys = [
            [
                'name' => 'Default Provider Key',
                'provider' => 'gemini',
                'key' => $defaultKey,
                'is_active' => true,
            ],
            [
                'name' => 'Secondary Fallback Key',
                'provider' => 'gemini',
                'key' => 'AIzaSy_MOCK_FALLBACK_KEY_DEMO',
                'is_active' => false,
            ],
        ];

        foreach ($geminiKeys as $k) {
            ApiKey::updateOrCreate(
                ['key' => $k['key']],
                [
                    'name' => $k['name'],
                    'provider' => $k['provider'],
                    'is_active' => $k['is_active'],
                    'error_count' => 0,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }
    }
}
