<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtOperator extends Model
{
    protected $table = 'ot_operators';

    protected $fillable = [
        'ot_emp_num',
        'ot_emp_name',
        'ot_access_level',
        'ot_account_status',
    ];

    protected $casts = [
        'ot_access_level'   => 'integer',
        'ot_account_status' => 'integer',
        'date_created'      => 'datetime',
        'date_updated'      => 'datetime',
    ];

    const CREATED_AT = 'date_created';
    const UPDATED_AT = 'date_updated';
}