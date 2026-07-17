<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The company's capability switches.
 *
 * These are not page permissions — modules and roles already decide who may open
 * what. These decide which capabilities the company has at all, which is why they
 * live in `settings` rather than in the module tree.
 */
class FeatureControlController extends Controller
{
    public function __construct(private readonly SettingService $settings) {}

    /**
     * Every switch, its current value, and what it does.
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = $this->settings->resolveCompanyId($request->query('company_id'));

        return response()->json([
            'data' => [
                'company_id' => $companyId,
                'flags' => $this->settings->describe($companyId),
                'companies' => Company::query()->orderBy('name')->get(['id', 'name']),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_id' => ['required', Rule::exists('companies', 'id')],
            'flags' => ['required', 'array'],
            // Values only — SettingService drops any key it does not recognise, so a
            // stray key cannot write an arbitrary row into the settings table.
            'flags.*' => ['boolean'],
        ]);

        $this->settings->save($data['company_id'], $data['flags']);

        return response()->json([
            'data' => [
                'company_id' => $data['company_id'],
                'flags' => $this->settings->describe($data['company_id']),
            ],
            'message' => 'Feature controls saved.',
        ]);
    }
}
