<?php

namespace App\Services;

use App\Models\OtOperator;
use App\Repositories\OtOperatorRepository;

class OtOperatorService
{
    public function __construct(
        private readonly OtOperatorRepository $repo,
        private readonly HrisApiService $hris,
    ) {}

    public function list(array $filters = []): array
    {
        $paginated = $this->repo->paginate($filters);

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

    public function create(
        string $empNum,
        string $empName,
        int $accessLevel,
        int $accountStatus
    ): OtOperator {
        if ($this->repo->findByEmpNum($empNum)) {
            throw new \RuntimeException('Employee is already registered as an operator.');
        }

        return $this->repo->create([
            'ot_emp_num'        => $empNum,
            'ot_emp_name'       => $empName,
            'ot_access_level'   => $accessLevel,
            'ot_account_status' => $accountStatus,
        ]);
    }

    public function update(
        OtOperator $operator,
        string $empNum,
        string $empName,
        int $accessLevel,
        int $accountStatus
    ): void {
        if ($empNum !== $operator->ot_emp_num) {
            $existing = $this->repo->findByEmpNum($empNum);
            if ($existing && $existing->id !== $operator->id) {
                throw new \RuntimeException('Employee is already registered as an operator.');
            }
        }

        $this->repo->update($operator, [
            'ot_emp_num'        => $empNum,
            'ot_emp_name'       => $empName,
            'ot_access_level'   => $accessLevel,
            'ot_account_status' => $accountStatus,
        ]);
    }

    public function delete(OtOperator $operator): void
    {
        $this->repo->delete($operator);
    }

    /**
     * Search active employees for the combobox.
     * Returns { options: [{value, label}], hasMore }.
     */
    public function searchEmployees(string $search, int $page): array
    {
        $result = $this->hris->fetchActiveEmployees($search, $page, 20);

        $options = array_map(function ($emp) {

            $empNum  = (string) ($emp['employid'] ?? $emp['emp_id'] ?? '');
            $empName = $emp['emp_name'] ?? '';
            return [
                'value' => $empNum,
                'label' =>  "{$empNum} - {$empName}",
            ];
        }, $result['data']);

        return [
            'options' => array_values($options),
            'hasMore' => $result['hasMore'],
        ];
    }
}
