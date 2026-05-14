<?php

namespace App\Http\Controllers;

use App\Models\OtOperator;
use App\Services\DashboardService;
use App\Services\HrisApiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $service,
        private readonly HrisApiService   $hrisApi,
    ) {}

    public function index(Request $request)
    {
        $empData       = session('emp_data', []);
        $empId         = (int) ($empData['emp_id']          ?? 0);
        $empPositionId = (int) ($empData['emp_position_id'] ?? 0);
        $year          = (int) ($request->query('year', now()->year));

        // ── Determine role ────────────────────────────────────────────────────
        $isOperator = OtOperator::where('ot_emp_num', $empId)
            ->where('ot_account_status', 1)
            ->exists();

        $directReports   = $this->hrisApi->fetchDirectReports($empId);
        $directReportIds = array_values(array_filter(array_column($directReports, 'emp_id')));
        $isApprover      = !empty($directReportIds) || $empPositionId === 6;

        // ── Build scope for queries ───────────────────────────────────────────
        $scope = $this->service->resolveScope($empId, $isOperator, $isApprover, $directReportIds);

        // ── Determine view role label for frontend ────────────────────────────
        if ($isOperator) {
            $viewRole = 'operator';
        } elseif ($isApprover) {
            $viewRole = 'approver';
        } else {
            $viewRole = 'employee';
        }

        return Inertia::render('Dashboard', [
            'summary'            => $this->service->getSummaryStats($scope),
            'monthlyTrend'       => $this->service->getMonthlyTrend($year, $scope),
            'topDepartments'     => $this->service->getTopDepartments($scope, 10),
            'statusDistribution' => $this->service->getStatusDistribution($scope),
            'recentRequests'     => $this->service->getRecentRequests($scope, 10),
            'year'               => $year,
            'viewRole'           => $viewRole,
        ]);
    }
}
