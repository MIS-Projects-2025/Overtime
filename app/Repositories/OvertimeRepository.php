<?php

namespace App\Repositories;

use App\Models\OvertimeRequest;
use App\Models\OvertimeItem;
use App\Models\OtApproval;
use App\Models\OtApproverRole;
use Illuminate\Support\Collection;

class OvertimeRepository
{
    public function findRequestByFormNo(string $formNo): ?OvertimeRequest
    {
        return OvertimeRequest::with(['items', 'approvals.role'])
            ->where('ot_form_no', $formNo)
            ->first();
    }

    public function getAllRequests(array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $allowedSorts = ['ot_form_no', 'department', 'productline', 'date_from', 'ot_status', 'date_created'];
        $orderBy  = in_array($filters['order_by'] ?? '', $allowedSorts) ? $filters['order_by'] : 'date_created';
        $orderDir = ($filters['order_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $perPage  = min(max((int) ($filters['per_page'] ?? 10), 1), 100);
        $pageName = $filters['page_name'] ?? 'page';

        $query = OvertimeRequest::with(['items', 'approvals.role'])
            ->orderBy($orderBy, $orderDir);

        if (!empty($filters['requestor_id'])) {
            $query->where('requestor_id', $filters['requestor_id']);
        }

        if (!empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }

        $status = $filters['status'] ?? '';
        if ($status === 'history') {
            // All non-pending records
            $query->where('ot_status', '>', 0);
        } elseif ($status !== '' && $status !== 'all') {
            $query->where('ot_status', (int) $status);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ot_form_no',   'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('productline', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage, ['*'], $pageName);
    }

    public function createRequest(array $data): OvertimeRequest
    {
        return OvertimeRequest::create($data);
    }

    public function createItem(array $data): OvertimeItem
    {
        return OvertimeItem::create($data);
    }

    public function createApproval(array $data): OtApproval
    {
        return OtApproval::create($data);
    }

    public function getRoles(): Collection
    {
        return OtApproverRole::all();
    }

    public function generateFormNo(): string
    {
        $prefix = 'OT' . date('y') . '-';

        $last = OvertimeRequest::where('ot_form_no', 'like', $prefix . '%')
            ->orderBy('ot_form_no', 'desc')
            ->lockForUpdate()
            ->value('ot_form_no');

        $seq = $last ? ((int) substr($last, strlen($prefix)) + 1) : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    public function deleteRequest(OvertimeRequest $request): void
    {
        $request->items()->delete();
        $request->approvals()->delete();
        $request->delete();
    }

    public function getExportRequests(?string $status, ?string $dateStart, ?string $dateEnd): \Illuminate\Support\Collection
    {
        $query = OvertimeRequest::with(['items', 'approvals.role'])
            ->orderBy('date_created', 'desc');

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('ot_status', (int) $status);
        }

        if ($dateStart) {
            $query->where('date_from', '>=', $dateStart);
        }

        if ($dateEnd) {
            $query->where('date_to', '<=', $dateEnd);
        }

        return $query->get();
    }

    public function updateRequestStatus(OvertimeRequest $request, int $status): void
    {
        $request->update(['ot_status' => $status]);
    }

    public function updateApproval(OtApproval $approval, array $data): void
    {
        $approval->update($data);
    }

    public function getApproverRequests(
        array $filters,
        array $directReportIds,
        int $empPositionId,
        bool $history = false
    ): \Illuminate\Pagination\LengthAwarePaginator {
        $allowedSorts = ['ot_form_no', 'department', 'productline', 'date_from', 'ot_status', 'date_created'];
        $orderBy  = in_array($filters['ap_order_by'] ?? '', $allowedSorts) ? $filters['ap_order_by'] : 'date_created';
        $orderDir = ($filters['ap_order_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $perPageKey = $history ? 'ah_per_page' : 'ap_per_page';
        $searchKey  = $history ? 'ah_search'   : 'ap_search';
        $pageName   = $history ? 'ah_page'      : 'ap_page';

        $perPage   = min(max((int) ($filters[$perPageKey] ?? 10), 1), 100);
        $hasDirect = !empty($directReportIds);
        $isPos6    = $empPositionId === 6;

        if (!$hasDirect && !$isPos6) {
            return new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage);
        }

        $query = OvertimeRequest::with(['items', 'approvals.role'])
            ->orderBy($orderBy, $orderDir);

        if ($history) {
            $query->where(function ($q) use ($hasDirect, $directReportIds, $isPos6) {
                if ($hasDirect) {
                    $q->orWhere(function ($inner) use ($directReportIds) {
                        $inner->whereIn('requestor_id', $directReportIds)
                              ->where('ot_status', '>', 0);
                    });
                }
                if ($isPos6) {
                    // Requests that moved past partially-approved
                    $q->orWhere('ot_status', '>', 1);
                }
            });
        } else {
            $query->where(function ($q) use ($hasDirect, $directReportIds, $isPos6) {
                if ($hasDirect) {
                    $q->orWhere(function ($inner) use ($directReportIds) {
                        $inner->whereIn('requestor_id', $directReportIds)
                              ->where('ot_status', OvertimeRequest::STATUS_PENDING);
                    });
                }
                if ($isPos6) {
                    $q->orWhere('ot_status', OvertimeRequest::STATUS_PARTIALLY_APPROVED);
                }
            });
        }

        if (!empty($filters[$searchKey])) {
            $search = $filters[$searchKey];
            $query->where(function ($q) use ($search) {
                $q->where('ot_form_no',   'like', "%{$search}%")
                  ->orWhere('department',  'like', "%{$search}%")
                  ->orWhere('productline', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage, ['*'], $pageName);
    }
}
