<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayrollApiService
{
    private string $baseUrl;
    private ?string $key;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.payroll.url'), '/');
        $this->key     = config('services.payroll.key');
    }

    /**
     * Fetch all payroll cutoff schedules.
     *
     * Optional params:
     *   year     – filter by year (e.g. 2026)
     *   per_page – paginate results
     *   search   – free-text filter (e.g. "2026-05")
     *   page     – page number when paginating
     *
     * Returns the raw data array, or [] on failure.
     */
    public function fetchCutoffSchedules(array $params = []): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->get("{$this->baseUrl}/api/payroll-cutoff-schedules", $params);

            if ($response->failed()) {
                Log::warning('Payroll fetchCutoffSchedules failed', [
                    'status' => $response->status(),
                    'params' => $params,
                ]);
                return [];
            }

            $data = $response->json('data') ?? $response->json();

            if (!is_array($data)) {
                return [];
            }

            // Normalize API field names to internal names
            return array_map(fn($row) => [
                'id'         => $row['ID']                 ?? null,
                'date_start' => $row['payroll_date_start'] ?? null,
                'date_end'   => $row['payroll_date_end']   ?? null,
            ], $data);
        } catch (\Exception $e) {
            Log::error("Payroll fetchCutoffSchedules exception: {$e->getMessage()}", ['params' => $params]);
            return [];
        }
    }

    /**
     * Fetch a single payroll cutoff schedule by ID.
     * Returns the record array, or null on failure / not found.
     */
    public function fetchCutoffScheduleById(int $id): ?array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->get("{$this->baseUrl}/api/payroll-cutoff-schedules/{$id}");

            if ($response->failed()) {
                Log::warning('Payroll fetchCutoffScheduleById failed', [
                    'id'     => $id,
                    'status' => $response->status(),
                ]);
                return null;
            }

            return $response->json('data') ?? null;
        } catch (\Exception $e) {
            Log::error("Payroll fetchCutoffScheduleById exception: {$e->getMessage()}", ['id' => $id]);
            return null;
        }
    }

    private function headers(): array
    {
        $headers = [];

        if ($this->key) {
            $headers['X-Internal-Key'] = $this->key;
        }

        return $headers;
    }
}
