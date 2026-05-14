<?php

namespace App\Repositories;

use App\Models\OvertimeItem;
use App\Models\OvertimeRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class DashboardRepository
{
    /**
     * Base query scoped to a set of requestor IDs.
     * null  → no filter (operator sees all)
     * array → filter to those requestor IDs (approver sees team / user sees own)
     */
    private function baseQuery(?array $requestorIds): Builder
    {
        $q = OvertimeRequest::query();

        if ($requestorIds !== null) {
            $q->whereIn('requestor_id', $requestorIds);
        }

        return $q;
    }

    public function getStatusCounts(?array $requestorIds): array
    {
        $rows = $this->baseQuery($requestorIds)
            ->select('ot_status', DB::raw('count(*) as total'))
            ->groupBy('ot_status')
            ->pluck('total', 'ot_status')
            ->toArray();

        return [
            'pending'     => (int) ($rows[OvertimeRequest::STATUS_PENDING]            ?? 0),
            'partial'     => (int) ($rows[OvertimeRequest::STATUS_PARTIALLY_APPROVED] ?? 0),
            'approved'    => (int) ($rows[OvertimeRequest::STATUS_APPROVED]           ?? 0),
            'disapproved' => (int) ($rows[OvertimeRequest::STATUS_DISAPPROVED]        ?? 0),
            'cancelled'   => (int) ($rows[OvertimeRequest::STATUS_CANCELLED]          ?? 0),
        ];
    }

    public function getMonthlyTrend(int $year, ?array $requestorIds): array
    {
        $rows = $this->baseQuery($requestorIds)
            ->select(
                DB::raw('MONTH(date_created) as month'),
                DB::raw('count(*) as total')
            )
            ->whereYear('date_created', $year)
            ->groupBy(DB::raw('MONTH(date_created)'))
            ->orderBy(DB::raw('MONTH(date_created)'))
            ->pluck('total', 'month')
            ->toArray();

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $months[$m] = (int) ($rows[$m] ?? 0);
        }

        return $months;
    }

    public function getTopDepartments(?array $requestorIds, int $limit = 10): array
    {
        return $this->baseQuery($requestorIds)
            ->select('department', DB::raw('count(*) as total'))
            ->groupBy('department')
            ->orderByDesc('total')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => ['department' => $r->department, 'total' => (int) $r->total])
            ->toArray();
    }

    public function getRecentRequests(?array $requestorIds, int $limit = 10): array
    {
        return $this->baseQuery($requestorIds)
            ->select(['ot_form_no', 'requestor_id', 'department', 'productline', 'ot_status', 'date_created'])
            ->orderByDesc('date_created')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'ot_form_no'   => $r->ot_form_no,
                'requestor_id' => $r->requestor_id,
                'department'   => $r->department,
                'productline'  => $r->productline,
                'ot_status'    => $r->ot_status,
                'date_created' => $r->date_created?->format('Y-m-d H:i'),
            ])
            ->toArray();
    }

    public function getTotalEmployeesOnOT(?array $requestorIds): int
    {
        $formNos = $this->baseQuery($requestorIds)->pluck('ot_form_no');

        if ($formNos->isEmpty()) {
            return 0;
        }

        return (int) OvertimeItem::whereIn('ot_form_code', $formNos)
            ->distinct('emp_num')
            ->count('emp_num');
    }
}
