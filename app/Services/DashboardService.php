<?php

namespace App\Services;

use App\Repositories\DashboardRepository;

class DashboardService
{
    public function __construct(
        private readonly DashboardRepository $repo
    ) {}

    /**
     * Determine the requestor scope to pass to repository queries.
     *
     * null        → no filter   (operator: sees all data)
     * int[]       → these IDs   (approver: sees direct reports' data)
     *                             (regular: sees only own request via [$empId])
     */
    public function resolveScope(int $empId, bool $isOperator, bool $isApprover, array $directReportIds): ?array
    {
        if ($isOperator) {
            return null;                          // all data
        }

        if ($isApprover && !empty($directReportIds)) {
            return [$empId];                      // approver is the requestor for their team
        }

        if ($isApprover && empty($directReportIds)) {
            return null;                          // position-6 org-wide approver → all data
        }

        return [$empId];                          // regular user → own data only
    }

    public function getSummaryStats(?array $scope): array
    {
        $counts = $this->repo->getStatusCounts($scope);
        $total  = array_sum($counts);

        return [
            'total'                 => $total,
            'pending'               => $counts['pending'],
            'partial'               => $counts['partial'],
            'approved'              => $counts['approved'],
            'disapproved'           => $counts['disapproved'],
            'cancelled'             => $counts['cancelled'],
            'total_employees_on_ot' => $this->repo->getTotalEmployeesOnOT($scope),
        ];
    }

    public function getMonthlyTrend(int $year, ?array $scope): array
    {
        $monthNames = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
            5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Aug',
            9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec',
        ];

        $data = $this->repo->getMonthlyTrend($year, $scope);

        return [
            'labels' => array_values($monthNames),
            'data'   => array_values($data),
        ];
    }

    public function getTopDepartments(?array $scope, int $limit = 10): array
    {
        $rows = $this->repo->getTopDepartments($scope, $limit);

        return [
            'labels' => array_column($rows, 'department'),
            'data'   => array_column($rows, 'total'),
        ];
    }

    public function getRecentRequests(?array $scope, int $limit = 10): array
    {
        return $this->repo->getRecentRequests($scope, $limit);
    }

    public function getStatusDistribution(?array $scope): array
    {
        $counts = $this->repo->getStatusCounts($scope);

        return [
            'labels' => ['Pending', 'Partial', 'Approved', 'Disapproved', 'Cancelled'],
            'data'   => [
                $counts['pending'],
                $counts['partial'],
                $counts['approved'],
                $counts['disapproved'],
                $counts['cancelled'],
            ],
        ];
    }
}
