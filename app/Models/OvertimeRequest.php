<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OvertimeRequest extends Model
{
    protected $table = 'ot_requests_new';

    protected $fillable = [
        'ot_form_no',
        'requestor_id',
        'department',
        'productline',
        'date_from',
        'date_to',
        'ot_status',
    ];

    protected $casts = [
        'date_from'    => 'date',
        'date_to'      => 'date',
        'ot_status'    => 'integer',
        'date_created' => 'datetime',
        'date_updated' => 'datetime',
    ];

    const CREATED_AT = 'date_created';
    const UPDATED_AT = 'date_updated';

    // Status constants
    const STATUS_PENDING            = 0;
    const STATUS_PARTIALLY_APPROVED = 1;
    const STATUS_APPROVED           = 2;
    const STATUS_DISAPPROVED        = 3;
    const STATUS_CANCELLED          = 4;

    public function items(): HasMany
    {
        return $this->hasMany(OvertimeItem::class, 'ot_form_code', 'ot_form_no');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(OtApproval::class, 'ot_form_no', 'ot_form_no');
    }
}
