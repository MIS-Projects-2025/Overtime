<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OvertimeItem extends Model
{
    protected $table = 'ot_items_new';

    protected $fillable = [
        'ot_form_code',
        'emp_num',
        'work_shift',
        'date_requested',
        'ot_date_from',
        'ot_date_to',
        'ot_time_from',
        'ot_time_to',
        'ot_reason',
    ];

    protected $casts = [
        'date_requested' => 'date',
        'ot_date_from'   => 'date',
        'ot_date_to'     => 'date',
        'date_created'   => 'datetime',
        'date_updated'   => 'datetime',
    ];

    const CREATED_AT = 'date_created';
    const UPDATED_AT = 'date_updated';

    public function overtimeRequest(): BelongsTo
    {
        return $this->belongsTo(OvertimeRequest::class, 'ot_form_code', 'ot_form_no');
    }
}
