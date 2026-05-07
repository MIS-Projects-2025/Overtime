<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OtApproval extends Model
{
    protected $table = 'ot_approvals';

    protected $fillable = [
        'ot_form_no',
        'role_id',
        'approver_name',
        'status',
        'remarks',
        'signed_at',
    ];

    protected $casts = [
        'status'       => 'integer',
        'signed_at'    => 'datetime',
        'date_created' => 'datetime',
        'date_updated' => 'datetime',
    ];

    const CREATED_AT = 'date_created';
    const UPDATED_AT = 'date_updated';

    const STATUS_PENDING  = 0;
    const STATUS_APPROVED = 1;
    const STATUS_REJECTED = 2;

    public function role(): BelongsTo
    {
        return $this->belongsTo(OtApproverRole::class, 'role_id');
    }

    public function overtimeRequest(): BelongsTo
    {
        return $this->belongsTo(OvertimeRequest::class, 'ot_form_no', 'ot_form_no');
    }
}
