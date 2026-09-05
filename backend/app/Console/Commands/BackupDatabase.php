<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup';
    protected $description = 'Cadangkan database PostgreSQL secara otomatis ke file terkompresi .sql.gz';

    public function handle()
    {
        $this->info('Memulai pencadangan database PostgreSQL...');

        $dbHost = config('database.connections.pgsql.host', '127.0.0.1');
        $dbPort = config('database.connections.pgsql.port', '5432');
        $dbName = config('database.connections.pgsql.database', 'wifi_management');
        $dbUser = config('database.connections.pgsql.username', 'postgres');
        $dbPass = config('database.connections.pgsql.password', '');

        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $timestamp = date('Y-m-d_H-i-s');
        $filename = "backup_{$dbName}_{$timestamp}.sql.gz";
        $filePath = "{$backupDir}/{$filename}";

        // Run pg_dump and pipe to gzip
        $cmd = "PGPASSWORD=\"{$dbPass}\" pg_dump -h {$dbHost} -p {$dbPort} -U {$dbUser} -F p {$dbName} | gzip > \"{$filePath}\"";
        
        $output = [];
        $returnCode = 0;
        exec($cmd, $output, $returnCode);

        if ($returnCode === 0 && file_exists($filePath) && filesize($filePath) > 0) {
            $fileSizeMb = round(filesize($filePath) / 1024 / 1024, 2);
            $msg = "Database berhasil dicadangkan ke: {$filePath} ({$fileSizeMb} MB)";
            $this->info($msg);
            Log::info("[DB_BACKUP_SUCCESS] " . $msg);

            // Auto-purge backups older than 14 days
            $files = File::files($backupDir);
            $cutoff = time() - (14 * 24 * 60 * 60);
            $purgedCount = 0;

            foreach ($files as $file) {
                if (filectime($file->getPathname()) < $cutoff) {
                    File::delete($file->getPathname());
                    $purgedCount++;
                }
            }

            if ($purgedCount > 0) {
                $this->info("Menghapus {$purgedCount} file backup lama (>14 hari).");
            }

            return Command::SUCCESS;
        } else {
            $errMsg = "Gagal mencadangkan database. Return code: {$returnCode}";
            $this->error($errMsg);
            Log::error("[DB_BACKUP_FAILED] " . $errMsg);
            return Command::FAILURE;
        }
    }
}