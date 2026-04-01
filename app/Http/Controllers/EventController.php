<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensurePermission(Permissions::MANAGE_EVENTS);

        $filters = $request->only(['search', 'status']);

        $events = Event::query()
            ->withCount('assignments')
            ->withSum('remittances as remittance_total', 'amount')
            ->withSum('shortages as shortage_total', 'amount')
            ->withSum('deductions as deduction_total', 'amount')
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = '%'.$request->string('search').'%';

                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('code', 'like', $search)
                        ->orWhere('name', 'like', $search)
                        ->orWhere('venue', 'like', $search);
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->value()))
            ->latest('event_date')
            ->paginate(8)
            ->withQueryString()
            ->through(fn (Event $event) => [
                'id' => $event->id,
                'code' => $event->code,
                'name' => $event->name,
                'slug' => $event->slug,
                'event_date' => $event->event_date?->format('Y-m-d'),
                'venue' => $event->venue,
                'status' => $event->status,
                'remarks' => $event->description,
                'assignments_count' => $event->assignments_count,
                'remittance_total' => (float) ($event->remittance_total ?? 0),
                'shortage_total' => (float) ($event->shortage_total ?? 0),
                'deduction_total' => (float) ($event->deduction_total ?? 0),
                'balance' => round((float) ($event->shortage_total ?? 0) - (float) ($event->deduction_total ?? 0), 2),
            ]);

        return Inertia::render('Events/Index', [
            'events' => $events,
            'filters' => $filters,
            'stats' => [
                'active' => Event::query()->where('status', 'active')->count(),
                'inactive' => Event::query()->where('status', 'inactive')->count(),
            ],
        ]);
    }

    public function show(Event $event): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_EVENTS);

        return redirect()->route('events.attendance.index', $event);
    }

    public function store(StoreEventRequest $request): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_EVENTS);

        $this->persistEvent(Event::query()->make(), $request->validated());

        return back()->with('success', 'Event created.');
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_EVENTS);

        $this->persistEvent($event, $request->validated());

        return back()->with('success', 'Event updated.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_EVENTS);

        if ($event->assignments()->exists() || $event->remittances()->exists() || $event->shortages()->exists() || $event->deductions()->exists()) {
            return back()->with('error', 'This event already has operational history and cannot be deleted.');
        }

        $event->delete();

        return back()->with('success', 'Event removed.');
    }

    private function persistEvent(Event $event, array $payload): void
    {
        DB::transaction(function () use ($event, $payload): void {
            $event->fill([
                ...$payload,
                'currency' => $payload['currency'] ?? 'PHP',
                'closed_at' => null,
            ]);
            $event->save();

            if ($payload['status'] === 'active') {
                Event::query()
                    ->whereKeyNot($event->id)
                    ->update(['status' => 'inactive']);
            }
        });
    }
}
