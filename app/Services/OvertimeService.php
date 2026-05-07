<?php

namespace App\Services;

use App\Models\OtApproval;
use App\Models\OvertimeRequest;
use App\Repositories\OvertimeRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OvertimeService
{
    public function __construct(
        private readonly OvertimeRepository $repo
    ) {}

    public function getRequests(array $filters = []): array
    {
        $paginated = $this->repo->getAllRequests($filters);

        return [
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'from'         => $paginated->firstItem(),
                'to'           => $paginated->lastItem(),
            ],
        ];
    }

    /**
     * Create an overtime request with its items and default approvals.
     *
     * $employees is an array of:
     * [
     *   'emp_num'      => string,
     *   'work_shift'   => string,
     *   'ot_date'      => string (Y-m-d),
     *   'ot_time_from' => string (H:i),
     *   'ot_time_to'   => string (H:i),
     *   'ot_reason'    => string,
     * ]
     */
    public function createRequest(array $requestData, array $employees): OvertimeRequest
    {
        return DB::transaction(function () use ($requestData, $employees) {
            $formNo = $this->repo->generateFormNo($requestData['department']);

            $request = $this->repo->createRequest([
                'ot_form_no'   => $formNo,
                'requestor_id' => $requestData['requestor_id'],
                'department'   => $requestData['department'],
                'productline'  => $requestData['productline'],
                'date_from'    => $requestData['date_from'],
                'date_to'      => $requestData['date_to'],
                'ot_status'    => OvertimeRequest::STATUS_PENDING,
            ]);

            foreach ($employees as $emp) {
                $this->repo->createItem([
                    'ot_form_code'   => $formNo,
                    'emp_num'        => $emp['emp_num'],
                    'work_shift'     => $emp['work_shift'],
                    'date_requested' => now()->toDateString(),
                    'ot_date_from'   => $emp['ot_date'],
                    'ot_date_to'     => $emp['ot_date'],
                    'ot_time_from'   => $emp['ot_time_from'],
                    'ot_time_to'     => $emp['ot_time_to'],
                    'ot_reason'      => $emp['ot_reason'],
                ]);
            }

            // Seed pending approval rows for each role
            $roles = $this->repo->getRoles();
            foreach ($roles as $role) {
                $this->repo->createApproval([
                    'ot_form_no'    => $formNo,
                    'role_id'       => $role->id,
                    'approver_name' => null,
                    'status'        => OtApproval::STATUS_PENDING,
                    'remarks'       => null,
                    'signed_at'     => null,
                ]);
            }

            return $request->load(['items', 'approvals.role']);
        });
    }

    public function deleteRequest(string $formNo): void
    {
        $request = $this->repo->findRequestByFormNo($formNo);

        if (!$request) {
            throw new \RuntimeException("Overtime request {$formNo} not found.");
        }

        $this->repo->deleteRequest($request);
    }

    public function cancelRequest(OvertimeRequest $request): void
    {
        $this->repo->updateRequestStatus($request, OvertimeRequest::STATUS_CANCELLED);
    }

    /**
     * Process a single approve or disapprove action on a specific ot_approval record.
     *
     * @param  OvertimeRequest $request
     * @param  int             $approvalId   The ot_approvals.id to update
     * @param  int             $approverId   The logged-in emp_id
     * @param  string          $action       'approve' | 'disapprove'
     * @param  string          $remarks
     */
    public function processApproval(
        OvertimeRequest $request,
        int $approvalId,
        int $approverId,
        string $action,
        string $remarks
    ): void {
        DB::transaction(function () use ($request, $approvalId, $approverId, $action, $remarks) {
            $approval = $request->approvals()->where('id', $approvalId)->firstOrFail();

            if ($approval->status !== OtApproval::STATUS_PENDING) {
                throw new \RuntimeException('This approval has already been processed.');
            }

            $newStatus = $action === 'approve'
                ? OtApproval::STATUS_APPROVED
                : OtApproval::STATUS_REJECTED;

            $this->repo->updateApproval($approval, [
                'approver_name' => $approverId,
                'status'        => $newStatus,
                'remarks'       => $remarks,
                'signed_at'     => now(),
            ]);

            $this->recalculateRequestStatus($request->fresh()->load('approvals'));
        });
    }

    /**
     * Process approve/disapprove for multiple form numbers.
     * Failures are logged and skipped so one bad record does not abort the rest.
     *
     * @param  string[]  $formNos
     * @param  int       $approverId
     * @param  callable  $resolveApprovalId  fn(OvertimeRequest) => int|null
     * @param  string    $action
     * @param  string    $remarks
     * @return array{success: int, failed: int}
     */
    public function processBulkAction(
        array $formNos,
        int $approverId,
        callable $resolveApprovalId,
        string $action,
        string $remarks
    ): array {
        $success = 0;
        $failed  = 0;

        foreach ($formNos as $formNo) {
            try {
                $request = $this->repo->findRequestByFormNo((string) $formNo);
                if (!$request) {
                    $failed++;
                    continue;
                }

                $approvalId = $resolveApprovalId($request);
                if (!$approvalId) {
                    $failed++;
                    continue;
                }

                $this->processApproval($request, $approvalId, $approverId, $action, $remarks);
                $success++;
            } catch (\Exception $e) {
                Log::warning("Bulk action failed for {$formNo}: {$e->getMessage()}");
                $failed++;
            }
        }

        return compact('success', 'failed');
    }

    public function getApproverRequests(array $filters, array $directReportIds, int $empPositionId, bool $history = false): array
    {
        $paginated = $this->repo->getApproverRequests($filters, $directReportIds, $empPositionId, $history);

        return [
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'from'         => $paginated->firstItem(),
                'to'           => $paginated->lastItem(),
            ],
        ];
    }

    private function recalculateRequestStatus(OvertimeRequest $request): void
    {
        $approvals = $request->approvals;
        $total     = $approvals->count();

        // Any disapproval → whole request is disapproved
        if ($approvals->contains('status', OtApproval::STATUS_REJECTED)) {
            $this->repo->updateRequestStatus($request, OvertimeRequest::STATUS_DISAPPROVED);
            return;
        }

        $approved = $approvals->where('status', OtApproval::STATUS_APPROVED)->count();

        if ($approved === $total) {
            $this->repo->updateRequestStatus($request, OvertimeRequest::STATUS_APPROVED);
        } elseif ($approved > 0) {
            $this->repo->updateRequestStatus($request, OvertimeRequest::STATUS_PARTIALLY_APPROVED);
        }
    }

    public function determineShift(string $timeFrom, int $shiftType): string
    {
        if ($shiftType === 1) {
            return 'N';
        }

        $time = (int) str_replace(':', '', $timeFrom);

        return ($time >= 700 && $time < 1900) ? 'A' : 'C';
    }
    public function findRequest(string $formNo): ?OvertimeRequest
    {
        return $this->repo->findRequestByFormNo($formNo);
    }

    public function getExportRequests(?string $status, ?string $dateStart, ?string $dateEnd): \Illuminate\Support\Collection
    {
        return $this->repo->getExportRequests($status, $dateStart, $dateEnd);
    }
}
