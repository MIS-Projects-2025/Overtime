<?php

use App\Http\Controllers\OvertimeController;
use App\Http\Controllers\OtOperatorController;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;

$app_name = config('app.name');

Route::prefix($app_name)
    ->middleware(AuthMiddleware::class)
    ->name('overtime.')
    ->group(function () {

        // ── OT Operators (admin) ─────────────────────────────────────────────
        Route::prefix('operators')->name('operators.')->group(function () {
            Route::get('/',                  [OtOperatorController::class, 'index'])->name('index');
            Route::post('/',                 [OtOperatorController::class, 'store'])->name('store');
            Route::get('/employees/search',  [OtOperatorController::class, 'searchEmployees'])->name('employees.search');
            Route::put('/{operator}',        [OtOperatorController::class, 'update'])->name('update');
            Route::delete('/{operator}',     [OtOperatorController::class, 'destroy'])->name('destroy');
        });

        Route::get('/requests',              [OvertimeController::class, 'index'])->name('index');
        Route::get('/create',               [OvertimeController::class, 'create'])->name('create');
        Route::post('/',                    [OvertimeController::class, 'store'])->name('store');
        Route::post('/bulk-action',         [OvertimeController::class, 'bulkAction'])->name('bulkAction');
        Route::get('/export',               [OvertimeController::class, 'export'])->name('export');
        Route::get('/{formNo}',             [OvertimeController::class, 'show'])->name('show');
        Route::delete('/{formNo}',          [OvertimeController::class, 'destroy'])->name('destroy');
        Route::patch('/{formNo}/cancel',    [OvertimeController::class, 'cancel'])->name('cancel');
        Route::post('/{formNo}/approve',    [OvertimeController::class, 'approve'])->name('approve');
        Route::post('/{formNo}/disapprove', [OvertimeController::class, 'disapprove'])->name('disapprove');
    });
