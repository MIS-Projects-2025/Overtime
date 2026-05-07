<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OtApproverRole extends Model
{
    protected $table = 'ot_approver_roles';

    public $timestamps = false;

    protected $fillable = [
        'role_code',
        'role_name',
    ];

    public function approvals(): HasMany
    {
        return $this->hasMany(OtApproval::class, 'role_id');
    }
}
