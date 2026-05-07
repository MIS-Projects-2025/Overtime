<?php

namespace App\Http\Controllers;

use App\Models\OtOperator;
use App\Services\OtOperatorService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OtOperatorController extends Controller
{
    public function __construct(private readonly OtOperatorService $service) {}

    public function index(Request $request): \Inertia\Response
    {
        $filters = $request->only(['search', 'per_page']);
        $result  = $this->service->list($filters);

        return Inertia::render('Overtime/Operators/Index', [
            'operators' => $result['data'],
            'meta'      => $result['meta'],
            'filters'   => $filters,
        ]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'emp_num'        => ['required', 'string', 'max:50'],
            'emp_name'       => ['required', 'string', 'max:255'],
            'access_level'   => ['required', 'integer', 'in:1,2'],
            'account_status' => ['required', 'integer', 'in:1,2'],
        ]);

        try {
            $this->service->create(
                $validated['emp_num'],
                $validated['emp_name'],
                $validated['access_level'],
                $validated['account_status'],
            );

            return back()->with('success', 'Operator added successfully.');
        } catch (\RuntimeException $e) {
            return back()->withErrors(['emp_num' => $e->getMessage()]);
        }
    }

    public function update(Request $request, OtOperator $operator): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'emp_num'        => ['required', 'string', 'max:50'],
            'emp_name'       => ['required', 'string', 'max:255'],
            'access_level'   => ['required', 'integer', 'in:1,2'],
            'account_status' => ['required', 'integer', 'in:1,2'],
        ]);

        try {
            $this->service->update(
                $operator,
                $validated['emp_num'],
                $validated['emp_name'],
                $validated['access_level'],
                $validated['account_status'],
            );

            return back()->with('success', 'Operator updated successfully.');
        } catch (\RuntimeException $e) {
            return back()->withErrors(['emp_num' => $e->getMessage()]);
        }
    }

    public function destroy(OtOperator $operator): \Illuminate\Http\RedirectResponse
    {
        $this->service->delete($operator);

        return back()->with('success', 'Operator removed successfully.');
    }

    public function searchEmployees(Request $request): \Illuminate\Http\JsonResponse
    {
        $search = (string) $request->input('search', '');
        $page   = max(1, (int) $request->input('page', 1));

        return response()->json($this->service->searchEmployees($search, $page));
    }
}
