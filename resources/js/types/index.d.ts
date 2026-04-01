import type { ToastPayload } from '@/Components/ToastProvider';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    job_title?: string | null;
    role_names: string[];
    permissions: string[];
}

export interface AppMeta {
    name: string;
    brandName: string;
    organization: string;
    systemName: string;
    tagline: string;
    primaryLogoUrl: string;
    wordmarkWhiteUrl: string;
    cleanWordmarkWhiteUrl: string;
    compactLogoUrl: string;
    compactLogoColorUrl: string;
    appIconUrl: string;
    appIconLargeUrl: string;
}

export interface FlashProps {
    success?: string;
    error?: string;
    toasts?: ToastPayload[];
}

export type ValidationErrors = Record<string, string>;

export interface ActiveEventMeta {
    id: number;
    code: string;
    name: string;
    event_date: string;
    venue?: string | null;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    links?: PaginationLink[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: AuthUser | null;
    };
    app: AppMeta;
    flash: FlashProps;
    activeEvent: ActiveEventMeta | null;
    errors: ValidationErrors;
};
