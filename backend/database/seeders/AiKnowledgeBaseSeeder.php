<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Carbon\Carbon;
use App\Models\AiKnowledgeBase;

class AiKnowledgeBaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $knowledgeBases = [
            [
                'question' => 'Internet Service Plans, Speeds, and Pricing at FiberPulse',
                'answer' => "📌 *FiberPulse High-Speed FTTH Plans:*\n• *Tier 1 (50 Mbps)* — $35 / mo (Ideal for home browsing & remote work)\n• *Tier 2 (150 Mbps)* — $55 / mo (4K Streaming, multi-user gaming)\n• *Gigabit Tier (1 Gbps)* — $85 / mo (Dedicated bandwidth & enterprise SLA)\n\n✨ *Key Benefits:*\n- Symmetrical upload/download speeds over pure fiber optic\n- Zero throttling, true unlimited data\n- Dual-band Wi-Fi 6 ONT provided",
                'is_active' => true,
            ],
            [
                'question' => 'Enterprise & Dedicated SLA Connectivity',
                'answer' => "🏢 *FiberPulse Enterprise Leased Lines:*\n• Dedicated 1:1 CIR bandwidth\n• 99.99% Network Uptime SLA with 24/7 NOC monitoring\n• Static IPv4 / IPv6 block allocation\n• Priority technician dispatch within 2 hours",
                'is_active' => true,
            ],
            [
                'question' => 'Fiber Optic Coverage & ODP Feasibility Check',
                'answer' => "📍 *Coverage Verification:*\nFiberPulse covers metro and suburban districts. Use the GIS map on our portal to locate the nearest ODP (Optical Distribution Point) within 250 meters of your premises for instant qualification.",
                'is_active' => true,
            ],
            [
                'question' => 'Troubleshooting: Red LOS Indicator or Connection Drops',
                'answer' => "🛠️ *Quick Optical Diagnostics:*\n1. Power cycle the Optical Network Terminal (ONT) by disconnecting power for 60 seconds.\n2. Verify the PON and LOS LEDs on the front panel:\n   - *PON Solid Green:* Optical power level is healthy (-18 dBm to -24 dBm).\n   - *LOS Flashing Red:* Optical loss detected on the drop cable; an automated ticket is dispatched to field technicians.\n3. Submit ticket via FiberPulse portal for automated line testing.",
                'is_active' => true,
            ],
            [
                'question' => 'About FiberPulse Platform & Operational Center',
                'answer' => "🌐 *About FiberPulse Telecom:*\n• Platform: Next-Generation FTTH Topology & Real-time Field Dispatch Operations Platform.\n• Network Operations Center (NOC): 24/7 Automated Optical Power Monitoring and Zero-Touch Subscriber Provisioning.",
                'is_active' => true,
            ],
            [
                'question' => 'Pindah Alamat Rumah (Relokasi Pasang) dan Upgrade / Downgrade Paket',
                'answer' => "🔄 *Informasi Relokasi & Perubahan Paket:*\n1. *Pindah Alamat (Relokasi):*\n   - Pelanggan yang pindah rumah tetap dapat menggunakan layanan FiberPulse selama lokasi baru berada dalam coverage area jaringan fiber optik kami.\n   - Cukup kirimkan Shareloc lokasi rumah baru dan ID Pelanggan. Teknisi kami akan membantu proses pemindahan kabel dan modem.\n2. *Upgrade / Downgrade Paket:*\n   - Perubahan paket kecepatan (misal dari 10 Mbps ke 50 Mbps) dapat diproses kapan saja tanpa biaya administrasi tambahan.\n   - Kecepatan baru akan langsung aktif dan penyesuaian tagihan berlaku pada periode bulan berikutnya.",
                'is_active' => true,
            ],
        ];

        foreach ($knowledgeBases as $kb) {
            AiKnowledgeBase::updateOrCreate(
                ['question' => $kb['question']],
                [
                    'answer' => $kb['answer'],
                    'is_active' => $kb['is_active'],
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }
    }
}
