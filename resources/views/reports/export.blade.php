<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            font-size: 12px;
            margin: 28px 32px;
        }

        .report-header {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
        }

        .brand-mark {
            width: 48px;
            height: 48px;
            vertical-align: middle;
        }

        .brand-copy {
            display: inline-block;
            vertical-align: middle;
            margin-left: 12px;
        }

        .brand-name {
            font-size: 24px;
            font-weight: 700;
            color: #082543;
            line-height: 1;
        }

        .brand-tagline {
            font-size: 10px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #e62825;
            margin-top: 4px;
        }

        h1 {
            font-size: 22px;
            margin: 18px 0 4px;
            color: #0f172a;
        }

        p {
            margin: 0 0 14px;
            color: #475569;
        }

        .summary {
            margin: 0 0 18px;
            padding: 14px 16px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 10px;
        }

        .summary span {
            display: inline-block;
            margin: 0 18px 6px 0;
            font-weight: 700;
            color: #082543;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th,
        td {
            border: 1px solid #cbd5e1;
            padding: 9px 10px;
            text-align: left;
        }

        th {
            background: #082543;
            color: #f8fafc;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        tr:nth-child(even) td {
            background: #f8fafc;
        }
    </style>
</head>
<body>
    <div class="report-header">
        <img src="{{ public_path('fightline/icon-192x192.png') }}" alt="FightLine icon" class="brand-mark">
        <div class="brand-copy">
            <div class="brand-name">FightLine</div>
            <div class="brand-tagline">Precision Betting Trusted Results</div>
        </div>
    </div>

    <h1>{{ $title }}</h1>
    <p>{{ $subtitle }}</p>

    <div class="summary">
        @foreach ($summary as $item)
            <span>{{ $item['label'] }}: {{ is_numeric($item['value']) ? number_format((float) $item['value'], 2) : $item['value'] }}</span>
        @endforeach
    </div>

    <table>
        <thead>
            <tr>
                @foreach ($columns as $column)
                    <th>{{ $column['label'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($columns as $column)
                        @php($value = $row[$column['key']] ?? '')
                        <td>
                            @if (is_numeric($value))
                                {{ number_format((float) $value, 2) }}
                            @else
                                {{ $value }}
                            @endif
                        </td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($columns) }}">No rows available for the selected filters.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
