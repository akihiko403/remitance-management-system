<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $eventId = $this->input('event_id') ?? $this->route('event')?->id;

        return [
            'event_id' => ['nullable', 'exists:events,id'],
            'person_id' => [
                'required',
                'exists:people,id',
                Rule::unique('event_teller_assignments', 'person_id')
                    ->where(fn ($query) => $query->where('event_id', $eventId)->where('teller_position', $this->string('teller_position'))),
            ],
            'teller_position' => ['required', 'string', 'max:120'],
            'team' => ['nullable', 'string', 'max:120'],
            'is_lead' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
