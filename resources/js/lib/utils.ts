import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined) {
    const numeric = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatNumber(value: number | string | null | undefined) {
    const numeric = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH').format(
        Number.isFinite(numeric) ? numeric : 0,
    );
}

export function hasPermission(
    permissions: string[] | undefined,
    permission: string,
) {
    return Boolean(permissions?.includes(permission));
}
