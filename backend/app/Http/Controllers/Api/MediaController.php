<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class MediaController extends Controller
{
    private $mediaPath;

    public function __construct()
    {
        $this->mediaPath = public_path('media');
        if (!File::exists($this->mediaPath)) {
            File::makeDirectory($this->mediaPath, 0755, true);
        }
    }

    public function index()
    {
        $files = File::files($this->mediaPath);
        $media = [];

        foreach ($files as $file) {
            $media[] = [
                'name' => $file->getFilename(),
                'size' => $file->getSize(),
                'url' => url('media/' . $file->getFilename()),
                'created_at' => filectime($file->getPathname())
            ];
        }

        // Sort by newest first
        usort($media, function($a, $b) {
            return $b['created_at'] <=> $a['created_at'];
        });

        return response()->json($media);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|image|max:5120' // max 5MB
        ]);

        $file = $request->file('file');
        
        // Sanitize filename to avoid weird characters
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $cleanName = preg_replace('/[^a-zA-Z0-9_-]/', '-', $originalName);
        $filename = $cleanName . '-' . time() . '.' . $file->getClientOriginalExtension();

        $file->move($this->mediaPath, $filename);

        return response()->json([
            'message' => 'Upload berhasil',
            'name' => $filename,
            'url' => url('media/' . $filename)
        ]);
    }

    public function destroy($filename)
    {
        // Prevent directory traversal
        $filename = basename($filename);
        $baseNameWithoutExt = pathinfo($filename, PATHINFO_FILENAME);

        $deletedCount = 0;
        $allFiles = File::files($this->mediaPath);

        foreach ($allFiles as $file) {
            $fn = $file->getFilename();
            $base = pathinfo($fn, PATHINFO_FILENAME);
            if ($base === $baseNameWithoutExt || $fn === $filename) {
                File::delete($file->getPathname());
                $deletedCount++;
            }
        }

        if ($deletedCount > 0) {
            return response()->json(['message' => "Berhasil menghapus gambar & seluruh format cadangannya."]);
        }

        return response()->json(['message' => 'File tidak ditemukan'], 404);
    }
}
