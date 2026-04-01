<?php

namespace App\Http\Controllers;

use App\Support\Permissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensurePermission(Permissions::VIEW_AUDIT_LOGS);

        $filters = $request->only(['search', 'log_name']);

        $logs = Activity::query()
            ->with('causer')
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = '%'.$request->string('search').'%';

                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('description', 'like', $search)
                        ->orWhere('subject_type', 'like', $search);
                });
            })
            ->when($request->filled('log_name'), fn ($query) => $query->where('log_name', $request->string('log_name')->value()))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Activity $activity) => [
                'id' => $activity->id,
                'log_name' => $activity->log_name,
                'description' => $activity->description,
                'subject' => class_basename((string) $activity->subject_type),
                'causer' => $activity->causer?->name ?? 'System',
                'properties' => $activity->properties,
                'created_at' => $activity->created_at?->toDayDateTimeString(),
            ]);

        return Inertia::render('AuditLogs/Index', [
            'logs' => $logs,
            'filters' => $filters,
            'logNames' => Activity::query()->distinct()->pluck('log_name')->filter()->values(),
        ]);
    }
}
