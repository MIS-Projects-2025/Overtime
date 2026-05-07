<?php

namespace App\Http\Controllers;

use App\Models\OtApproval;
use App\Models\OtOperator;
use App\Models\OvertimeRequest;
use App\Services\HrisApiService;
use App\Services\OvertimeService;
use App\Services\PayrollApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OvertimeController extends Controller
{
    public function __construct(
        private readonly OvertimeService   $service,
        private readonly HrisApiService    $hrisApi,
        private readonly PayrollApiService $payrollApi,
    ) {}

    // ── Session helpers ───────────────────────────────────────────────────────

    private function empData(): array
    {
        return session('emp_data', []);
    }

    private function empId(): int
    {
        return (int) ($this->empData()['emp_id'] ?? 0);
    }

    // ── Pages ─────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $empData       = $this->empData();
        $empId         = $this->empId();
        $empPositionId = (int) ($empData['emp_position_id'] ?? 0);
        $baseSort      = $request->only(['order_by', 'order_dir']);

        // ── My Requests: pending only (status = 0) ────────────────────────────
        $myPendingData = $this->service->getRequests(array_merge($baseSort, [
            'requestor_id' => $empId,
            'status'       => '0',
            'search'       => $request->input('search', ''),
            'per_page'     => $request->input('per_page', 10),
            'page_name'    => 'page',
        ]));

        // ── My Request History: non-pending (status > 0) ──────────────────────
        $myHistoryData = $this->service->getRequests(array_merge($baseSort, [
            'requestor_id' => $empId,
            'status'       => 'history',
            'search'       => $request->input('h_search', ''),
            'per_page'     => $request->input('h_per_page', 10),
            'page_name'    => 'h_page',
        ]));

        // ── Approver data ─────────────────────────────────────────────────────
        $directReports   = $this->hrisApi->fetchDirectReports($empId);
        $directReportIds = array_values(array_filter(array_column($directReports, 'emp_id')));
        $isApprover  = !empty($directReportIds) || $empPositionId === 6;
        $isOperator  = OtOperator::where('ot_emp_num', $empId)
            ->where('ot_account_status', 1)
            ->exists();

        $cutoffPeriods = $isOperator
            ? $this->payrollApi->fetchCutoffSchedules(['year' => now()->year])
            : [];

        $approverFilters = $request->only([
            'ap_search',
            'ap_order_by',
            'ap_order_dir',
            'ap_per_page',
            'ah_search',
            'ah_per_page',
        ]);

        $approvalPendingData = $this->service->getApproverRequests(
            $approverFilters,
            $directReportIds,
            $empPositionId,
            false,
        );

        $approvalHistoryData = $this->service->getApproverRequests(
            $approverFilters,
            $directReportIds,
            $empPositionId,
            true,
        );

        return Inertia::render('Overtime/Index', [
            'myPending'           => $myPendingData['data'],
            'myPendingMeta'       => $myPendingData['meta'],
            'myHistory'           => $myHistoryData['data'],
            'myHistoryMeta'       => $myHistoryData['meta'],
            'approvalPending'     => $approvalPendingData['data'],
            'approvalPendingMeta' => $approvalPendingData['meta'],
            'approvalHistory'     => $approvalHistoryData['data'],
            'approvalHistoryMeta' => $approvalHistoryData['meta'],
            'filters'             => $request->only([
                'search',
                'order_by',
                'order_dir',
                'per_page',
                'h_search',
                'h_per_page',
                'ap_search',
                'ap_per_page',
                'ah_search',
                'ah_per_page',
            ]),
            'empData'       => $empData,
            'isApprover'    => $isApprover,
            'isOperator'    => $isOperator,
            'cutoffPeriods' => $cutoffPeriods,
        ]);
    }

    public function create(): Response
    {
        $empData = $this->empData();
        $empId   = $this->empId();

        $workDetails = $this->hrisApi->fetchWorkDetails($empId);

        $empData['emp_dept']    = $workDetails['department'] ?? '';
        $empData['emp_prodline'] = $workDetails['prod_line'] ?? '';

        $directReports = $this->hrisApi->fetchDirectReports($empId);

        $directReports[] = [
            'emp_id'     => $empId,
            'emp_name'   => $empData['emp_name']  ?? '',
            'shift_type' => (int) ($empData['shift_type'] ?? 1),
        ];

        $seen      = [];
        $employees = [];
        foreach ($directReports as $emp) {
            $id = (int) ($emp['emp_id'] ?? 0);
            if ($id && !isset($seen[$id])) {
                $seen[$id]   = true;
                $employees[] = [
                    'emp_id'     => $id,
                    'emp_name'   => $emp['emp_name']   ?? '',
                    'shift_type' => (int) ($emp['shift_type'] ?? 1),
                ];
            }
        }

        $cutoffPeriods = $this->payrollApi->fetchCutoffSchedules([
            'year' => now()->year,
        ]);

        return Inertia::render('Overtime/Create', [
            'empData'       => $empData,
            'employees'     => $employees,
            'cutoffPeriods' => $cutoffPeriods,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'department'               => 'required|string',
            'productline'              => 'required|string',
            'date_from'                => 'required|date',
            'date_to'                  => 'required|date|after_or_equal:date_from',
            'employees'                => 'required|array|min:1',
            'employees.*.emp_num'      => 'required|string',
            'employees.*.work_shift'   => 'required|in:N,A,C',
            'employees.*.ot_date'      => 'required|date',
            'employees.*.ot_time_from' => 'required|date_format:H:i',
            'employees.*.ot_time_to'   => 'required|date_format:H:i',
            'employees.*.ot_reason'    => 'required|string',
        ]);

        $otRequest = $this->service->createRequest(
            [
                'requestor_id' => $this->empId(),
                'department'   => $validated['department'],
                'productline'  => $validated['productline'],
                'date_from'    => $validated['date_from'],
                'date_to'      => $validated['date_to'],
            ],
            $validated['employees']
        );

        return redirect()
            ->route('overtime.show', $otRequest->ot_form_no)
            ->with('success', 'Overtime request created successfully.');
    }

    public function show(string $formNo): Response
    {
        $otRequest = $this->service->findRequest($formNo);

        abort_if(!$otRequest, 404);

        $empData    = $this->empData();
        $loggedInId = $this->empId();

        // Bulk-resolve employee names
        $empNos = $otRequest->items
            ->pluck('emp_num')
            ->map(fn($n) => (int) $n)
            ->unique()
            ->values()
            ->all();

        $approverIds = $otRequest->approvals
            ->whereNotNull('approver_name')
            ->where('status', '>', 0)
            ->pluck('approver_name')
            ->map(fn($n) => (int) $n)
            ->filter()
            ->values()
            ->all();

        $allEmpNos = collect($empNos)
            ->merge($approverIds)
            ->push((int) $otRequest->requestor_id)
            ->unique()
            ->values()
            ->all();

        $empMap = $this->hrisApi->fetchEmployeesBulk($allEmpNos);

        $items = $otRequest->items->map(function ($item) use ($empMap) {
            return array_merge($item->toArray(), [
                'emp_name' => $empMap[(int) $item->emp_num]['emp_name'] ?? null,
            ]);
        })->values()->toArray();

        $approvals = $otRequest->approvals->map(function ($approval) use ($empMap) {
            $data = $approval->toArray();
            if ($approval->status > 0 && $approval->approver_name) {
                $data['approver_name'] = $empMap[(int) $approval->approver_name]['emp_name']
                    ?? $approval->approver_name;
            }
            return $data;
        })->values()->toArray();

        $requestorName = $empMap[(int) $otRequest->requestor_id]['emp_name']
            ?? $this->hrisApi->fetchEmployeeName($otRequest->requestor_id);

        // Determine if the logged-in user can approve/disapprove this request
        $myApproval = $this->resolveMyApproval($otRequest, $loggedInId, $empData);

        return Inertia::render('Overtime/Show', [
            'otRequest'     => $otRequest,
            'items'         => $items,
            'approvals'     => $approvals,
            'requestorName' => $requestorName,
            'empData'       => $empData,
            'canApprove'    => $myApproval !== null,
            'myApprovalId'  => $myApproval?->id,
            'isRequestor'   => $loggedInId === (int) $otRequest->requestor_id,
        ]);
    }

    public function destroy(string $formNo): RedirectResponse
    {
        $this->service->deleteRequest($formNo);

        return redirect()
            ->route('overtime.index')
            ->with('success', 'Overtime request deleted.');
    }

    // ── Approval actions ──────────────────────────────────────────────────────

    public function cancel(string $formNo): RedirectResponse
    {
        $empId     = $this->empId();
        $otRequest = $this->service->findRequest($formNo);

        abort_if(!$otRequest, 404);
        abort_if((int) $otRequest->requestor_id !== $empId, 403);
        abort_if(
            $otRequest->ot_status !== OvertimeRequest::STATUS_PENDING,
            422,
            'Only pending requests can be cancelled.'
        );

        $this->service->cancelRequest($otRequest);

        return redirect()
            ->route('overtime.index')
            ->with('success', 'Overtime request cancelled.');
    }

    public function approve(Request $request, string $formNo): RedirectResponse
    {
        $validated = $request->validate([
            'remarks' => 'required|string|max:500',
        ]);

        $empId     = $this->empId();
        $empData   = $this->empData();
        $otRequest = $this->service->findRequest($formNo);

        abort_if(!$otRequest, 404);

        $myApproval = $this->resolveMyApproval($otRequest, $empId, $empData);
        abort_if(!$myApproval, 403, 'You are not authorised to approve this request.');

        $this->service->processApproval($otRequest, $myApproval->id, $empId, 'approve', $validated['remarks']);

        return back()->with('success', 'Overtime request approved.');
    }

    public function disapprove(Request $request, string $formNo): RedirectResponse
    {
        $validated = $request->validate([
            'remarks' => 'required|string|max:500',
        ]);

        $empId     = $this->empId();
        $empData   = $this->empData();
        $otRequest = $this->service->findRequest($formNo);

        abort_if(!$otRequest, 404);

        $myApproval = $this->resolveMyApproval($otRequest, $empId, $empData);
        abort_if(!$myApproval, 403, 'You are not authorised to disapprove this request.');

        $this->service->processApproval($otRequest, $myApproval->id, $empId, 'disapprove', $validated['remarks']);

        return back()->with('success', 'Overtime request disapproved.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'form_nos'   => 'required|array|min:1',
            'form_nos.*' => 'required|string',
            'action'     => 'required|in:approve,disapprove',
            'remarks'    => 'required|string|max:500',
        ]);

        $empId   = $this->empId();
        $empData = $this->empData();

        $result = $this->service->processBulkAction(
            $validated['form_nos'],
            $empId,
            fn($otRequest) => $this->resolveMyApproval($otRequest, $empId, $empData)?->id,
            $validated['action'],
            $validated['remarks'],
        );

        $verb = $validated['action'] === 'approve' ? 'approved' : 'disapproved';
        $msg  = "{$result['success']} request(s) {$verb}.";
        if ($result['failed'] > 0) {
            $msg .= " {$result['failed']} skipped.";
        }

        return back()->with('success', $msg);
    }

    // ── Export ────────────────────────────────────────────────────────────────

    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        abort_if(
            !OtOperator::where('ot_emp_num', $this->empId())
                ->where('ot_account_status', 1)
                ->exists(),
            403
        );

        $status    = $request->input('status');
        $dateStart = $request->input('date_start');
        $dateEnd   = $request->input('date_end');

        $requests = $this->service->getExportRequests($status, $dateStart, $dateEnd);

        $allEmpNos = $requests
            ->flatMap(fn($r) => $r->items->pluck('emp_num')->map(fn($n) => (int) $n))
            ->merge($requests->pluck('requestor_id')->map(fn($n) => (int) $n))
            ->unique()
            ->values()
            ->all();

        $empMap = $this->hrisApi->fetchEmployeesBulk($allEmpNos);

        $statusLabels = [
            0 => 'Pending',
            1 => 'Partially Approved',
            2 => 'Approved',
            3 => 'Disapproved',
            4 => 'Cancelled',
        ];

        $filename = 'overtime-export-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($requests, $empMap, $statusLabels) {
            $out = fopen('php://output', 'w');
            fputs($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'EMP. NO.',
                'EMP. NAME',
                'DATE REQUESTED',
                'TIME START',
                'TIME END',
                'NO. OF HOURS',
                'REMARKS',
                'DATE APPROVED',
                'STATUS',
            ]);

            foreach ($requests as $req) {
                $dateApproved = $req->approvals
                    ->where('status', OtApproval::STATUS_APPROVED)
                    ->sortByDesc('role_id')
                    ->first()
                    ?->signed_at
                    ?->format('m/d/Y H:i');

                foreach ($req->items as $item) {
                    try {
                        $empNo   = (string) $item->emp_num;
                        $empName = $empMap[(int) $empNo]['emp_name'] ?? '';

                        $timeFrom = \Carbon\Carbon::parse($item->ot_time_from);
                        $timeTo   = \Carbon\Carbon::parse($item->ot_time_to);

                        if ($timeTo->lessThanOrEqualTo($timeFrom)) {
                            $timeTo->addDay();
                        }

                        $hours = $timeFrom->diffInMinutes($timeTo) / 60;
                        $hours = round($hours * 2) / 2;

                        $dateRequested = $item->ot_date_from
                            ? \Carbon\Carbon::parse($item->ot_date_from)->format('m/d/Y')
                            : '';

                        fputcsv($out, [
                            $empNo,
                            $empName,
                            $dateRequested,
                            $timeFrom->format('H:i'),
                            $timeTo->format('H:i'),
                            $hours % 1 === 0 ? (int) $hours : number_format($hours, 1),
                            $item->ot_reason ?? '',
                            $dateApproved ?? '',
                            $statusLabels[$req->ot_status] ?? '',
                        ]);
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning("Export: skipped item id={$item->id}: {$e->getMessage()}");
                    }
                }
            }

            fclose($out);
        }, $filename, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Determine which OtApproval record the logged-in user should act on.
     * Returns null if the user is not an approver for this request or if
     * their approval record has already been processed.
     */
    private function resolveMyApproval(
        OvertimeRequest $otRequest,
        int $empId,
        array $empData
    ): ?OtApproval {
        $empPositionId = (int) ($empData['emp_position_id'] ?? 0);

        // Fetch approver hierarchy for the requestor from HRIS
        $approvers = $this->hrisApi->fetchApprovers((int) $otRequest->requestor_id);

        $myRoleId = null;
        if ($approvers) {
            if ((int) ($approvers['approver1_id'] ?? 0) === $empId) {
                $myRoleId = 1;
            } elseif ((int) ($approvers['approver2_id'] ?? 0) === $empId) {
                $myRoleId = 2;
            } elseif ((int) ($approvers['approver3_id'] ?? 0) === $empId) {
                $myRoleId = 3;
            }
        }

        if ($myRoleId !== null) {
            return $otRequest->approvals
                ->where('role_id', $myRoleId)
                ->where('status', OtApproval::STATUS_PENDING)
                ->first() ?: null;
        }

        // Position-5 employees (Operations Director) act on status-1 requests
        if (
            $empPositionId === 6
            && $otRequest->ot_status === OvertimeRequest::STATUS_PARTIALLY_APPROVED
        ) {
            return $otRequest->approvals
                ->where('status', OtApproval::STATUS_PENDING)
                ->sortByDesc('role_id')
                ->first() ?: null;
        }

        return null;
    }
}
