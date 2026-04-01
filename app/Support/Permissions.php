<?php

namespace App\Support;

final class Permissions
{
    public const VIEW_DASHBOARD = 'view dashboard';
    public const MANAGE_PEOPLE = 'manage people';
    public const MANAGE_EVENTS = 'manage events';
    public const MANAGE_ASSIGNMENTS = 'manage assignments';
    public const MANAGE_REMITTANCES = 'manage remittances';
    public const MANAGE_SHORTAGES = 'manage shortages';
    public const MANAGE_DEDUCTIONS = 'manage deductions';
    public const VIEW_REPORTS = 'view reports';
    public const VIEW_AUDIT_LOGS = 'view audit logs';
    public const MANAGE_SETTINGS = 'manage settings';
    public const MANAGE_USERS = 'manage users';

    public static function all(): array
    {
        return [
            self::VIEW_DASHBOARD,
            self::MANAGE_PEOPLE,
            self::MANAGE_EVENTS,
            self::MANAGE_ASSIGNMENTS,
            self::MANAGE_REMITTANCES,
            self::MANAGE_SHORTAGES,
            self::MANAGE_DEDUCTIONS,
            self::VIEW_REPORTS,
            self::VIEW_AUDIT_LOGS,
            self::MANAGE_SETTINGS,
            self::MANAGE_USERS,
        ];
    }

    public static function roleMatrix(): array
    {
        return [
            'super-admin' => self::all(),
            'finance-admin' => [
                self::VIEW_DASHBOARD,
                self::MANAGE_PEOPLE,
                self::MANAGE_EVENTS,
                self::MANAGE_ASSIGNMENTS,
                self::MANAGE_REMITTANCES,
                self::MANAGE_SHORTAGES,
                self::MANAGE_DEDUCTIONS,
                self::VIEW_REPORTS,
                self::VIEW_AUDIT_LOGS,
                self::MANAGE_SETTINGS,
                self::MANAGE_USERS,
            ],
            'encoder' => [
                self::VIEW_DASHBOARD,
                self::MANAGE_PEOPLE,
                self::MANAGE_EVENTS,
                self::MANAGE_ASSIGNMENTS,
                self::MANAGE_REMITTANCES,
                self::MANAGE_SHORTAGES,
                self::MANAGE_DEDUCTIONS,
                self::VIEW_REPORTS,
            ],
            'auditor' => [
                self::VIEW_DASHBOARD,
                self::VIEW_REPORTS,
                self::VIEW_AUDIT_LOGS,
            ],
            'viewer' => [
                self::VIEW_DASHBOARD,
                self::VIEW_REPORTS,
            ],
        ];
    }
}
