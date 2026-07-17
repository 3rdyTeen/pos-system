<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shift\CloseShiftRequest;
use App\Http\Requests\Shift\OpenShiftRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Shift;
use App\Services\ShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function __construct(private readonly ShiftService $service) {}

    /**
     * The open shift on a register, if there is one.
     *
     * The terminal calls this on load to decide whether to show the sell screen or
     * the "open your drawer" prompt, so a missing shift is a normal answer rather
     * than a 404.
     */
    public function current(Request $request): JsonResponse
    {
        $registerId = $request->query('register_id');
        $shift = $registerId ? $this->service->openShiftFor($registerId) : null;

        return response()->json([
            'data' => $shift ? ShiftResource::make($shift->load(['register', 'user'])) : null,
            'reconciliation' => $shift ? $this->service->reconcile($shift) : null,
        ]);
    }

    public function show(Shift $shift): JsonResponse
    {
        return response()->json([
            'data' => ShiftResource::make($shift->load(['register', 'user'])),
            'reconciliation' => $this->service->reconcile($shift),
        ]);
    }

    public function open(OpenShiftRequest $request): JsonResponse
    {
        $data = $request->validated();

        $shift = $this->service->open(
            registerId: $data['register_id'],
            // The drawer belongs to whoever is signed in, never to a posted id.
            userId: $request->user()->id,
            openingBalance: (float) $data['opening_balance'],
            notes: $data['notes'] ?? null,
        );

        return response()->json([
            'data' => ShiftResource::make($shift->load(['register', 'user'])),
            'reconciliation' => $this->service->reconcile($shift),
        ], 201);
    }

    public function close(CloseShiftRequest $request, Shift $shift): JsonResponse
    {
        $data = $request->validated();

        $shift = $this->service->close(
            $shift,
            isset($data['closing_balance']) ? (float) $data['closing_balance'] : null,
            $data['notes'] ?? null,
        );

        return response()->json([
            'data' => ShiftResource::make($shift->load(['register', 'user'])),
            // The figures the cashier is asked to sign off on.
            'reconciliation' => $this->service->reconcile($shift),
        ]);
    }
}
