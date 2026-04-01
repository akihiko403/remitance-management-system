<?php

namespace App\Http\Requests;

use App\Models\EventTellerAssignment;
use Illuminate\Foundation\Http\FormRequest;

class SyncEventAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'attendees' => ['required', 'array'],
            'attendees.*.person_id' => ['required', 'integer', 'exists:people,id'],
            'attendees.*.present' => ['required', 'boolean'],
            'attendees.*.teller_label' => ['nullable', 'string', 'max:120'],
            'attendees.*.teller_number' => ['nullable', 'integer', 'min:1', 'max:9999'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator): void {
                $people = [];
                $designations = [];

                foreach ($this->input('attendees', []) as $index => $attendee) {
                    $personId = (int) $attendee['person_id'];

                    if (isset($people[$personId])) {
                        $validator->errors()->add("attendees.$index.person_id", 'A person can only appear once in the event attendance list.');
                    }

                    $people[$personId] = true;

                    if (! ($attendee['present'] ?? false)) {
                        continue;
                    }

                    $label = trim((string) ($attendee['teller_label'] ?? ''));
                    $number = $attendee['teller_number'] ?? null;

                    if ($label === '') {
                        $validator->errors()->add("attendees.$index.teller_label", 'Teller label is required for present attendees.');
                        continue;
                    }

                    if ($number === null || (int) $number < 1) {
                        $validator->errors()->add("attendees.$index.teller_number", 'Teller number must be at least 1 for present attendees.');
                        continue;
                    }

                    $fullDisplay = EventTellerAssignment::buildFullTellerDisplay($label, $number);

                    if (isset($designations[$fullDisplay])) {
                        $validator->errors()->add("attendees.$index.full_teller_display", 'Teller designation must be unique within the event.');
                    }

                    $designations[$fullDisplay] = true;
                }
            },
        ];
    }
}
