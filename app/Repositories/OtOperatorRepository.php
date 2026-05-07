<?php

namespace App\Repositories;

use App\Models\OtOperator;
use Illuminate\Pagination\LengthAwarePaginator;

class OtOperatorRepository
{
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);
        $search  = $filters['search'] ?? '';

        $query = OtOperator::query()->orderBy('date_created', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('ot_emp_num',  'like', "%{$search}%")
                  ->orWhere('ot_emp_name', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?OtOperator
    {
        return OtOperator::find($id);
    }

    public function findByEmpNum(string $empNum): ?OtOperator
    {
        return OtOperator::where('ot_emp_num', $empNum)->first();
    }

    public function create(array $data): OtOperator
    {
        return OtOperator::create($data);
    }

    public function update(OtOperator $operator, array $data): void
    {
        $operator->update($data);
    }

    public function delete(OtOperator $operator): void
    {
        $operator->delete();
    }
}
