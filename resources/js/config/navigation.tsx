import type { ComponentType, SVGProps } from 'react';
import {
    BanknotesIcon,
    CalendarDaysIcon,
    Cog6ToothIcon,
    DocumentChartBarIcon,
    HomeIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    WalletIcon,
} from '@heroicons/react/24/solid';

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavigationItem = {
    key: string;
    label: string;
    route: string;
    match: string;
    permission: string;
    icon: NavIcon;
};

export type NavigationGroup = {
    key: string;
    label: string;
    items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
    {
        key: 'overview',
        label: 'Overview',
        items: [
            {
                key: 'dashboard',
                label: 'Dashboard',
                route: 'dashboard',
                match: 'dashboard',
                permission: 'view dashboard',
                icon: HomeIcon,
            },
        ],
    },
    {
        key: 'operations',
        label: 'Operations',
        items: [
            {
                key: 'people',
                label: 'People Masterlist',
                route: 'people.index',
                match: 'people.*',
                permission: 'manage people',
                icon: UserGroupIcon,
            },
            {
                key: 'events',
                label: 'Events',
                route: 'events.index',
                match: 'events.*',
                permission: 'manage events',
                icon: CalendarDaysIcon,
            },
            {
                key: 'remittances',
                label: 'Remittance',
                route: 'remittances.index',
                match: 'remittances.*',
                permission: 'manage remittances',
                icon: BanknotesIcon,
            },
            {
                key: 'deductions',
                label: 'Deductions',
                route: 'deductions.index',
                match: 'deductions.*',
                permission: 'manage deductions',
                icon: WalletIcon,
            },
        ],
    },
    {
        key: 'governance',
        label: 'Governance',
        items: [
            {
                key: 'reports',
                label: 'Reports',
                route: 'reports.event-shortages',
                match: 'reports.*',
                permission: 'view reports',
                icon: DocumentChartBarIcon,
            },
            {
                key: 'audit-logs',
                label: 'Audit Logs',
                route: 'audit-logs.index',
                match: 'audit-logs.*',
                permission: 'view audit logs',
                icon: ShieldCheckIcon,
            },
            {
                key: 'settings',
                label: 'Settings',
                route: 'settings.index',
                match: 'settings.*',
                permission: 'manage settings',
                icon: Cog6ToothIcon,
            },
        ],
    },
];
