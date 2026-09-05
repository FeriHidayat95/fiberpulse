<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'additional_materials' => 'array',
        'documentation_photos' => 'array',
    ];

    public function technician()
    {
        return $this->belongsTo(Technician::class);
    }

    public function odp()
    {
        return $this->belongsTo(Odp::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function assetTransactions()
    {
        return $this->hasMany(AssetTransaction::class);
    }
}
