<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Technician extends Model
{
    use HasFactory;

    protected $table = 'users';

    protected $guarded = ['id'];

    // Automatically filter technicians
    protected static function booted()
    {
        static::addGlobalScope('teknisi', function ($builder) {
            $builder->where('role', 'teknisi')->orWhere('role', 'Teknisi');
        });
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'technician_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'assigned_technician_id');
    }
}
