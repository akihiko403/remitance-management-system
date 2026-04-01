import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastPayload = {
    id?: string;
    type: ToastType;
    message: string;
    title?: string | null;
    duration?: number | null;
};

type ToastRecord = ToastPayload & {
    id: string;
};

type ToastContextValue = {
    addToast: (toast: ToastPayload) => string;
    removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastType, number> = {
    success: 3600,
    info: 4200,
    warning: 5200,
    error: 6500,
};

function buildToastId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toneClasses(type: ToastType) {
    switch (type) {
        case 'success':
            return {
                shell: 'border-emerald-500/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(255,255,255,0.04))] shadow-[0_18px_48px_rgba(16,185,129,0.16)]',
                iconWrap: 'bg-emerald-500/20 text-emerald-300',
                eyebrow: 'text-emerald-200/75',
                icon: CheckCircleIcon,
            };
        case 'warning':
            return {
                shell: 'border-amber-500/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(255,255,255,0.04))] shadow-[0_18px_48px_rgba(245,158,11,0.14)]',
                iconWrap: 'bg-amber-500/20 text-amber-200',
                eyebrow: 'text-amber-100/75',
                icon: ExclamationTriangleIcon,
            };
        case 'info':
            return {
                shell: 'border-sky-500/30 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(255,255,255,0.04))] shadow-[0_18px_48px_rgba(14,165,233,0.14)]',
                iconWrap: 'bg-sky-500/20 text-sky-200',
                eyebrow: 'text-sky-100/75',
                icon: InformationCircleIcon,
            };
        case 'error':
        default:
            return {
                shell: 'border-rose-500/32 bg-[linear-gradient(135deg,rgba(244,63,94,0.16),rgba(255,255,255,0.04))] shadow-[0_18px_48px_rgba(244,63,94,0.14)]',
                iconWrap: 'bg-rose-500/20 text-rose-200',
                eyebrow: 'text-rose-100/75',
                icon: ExclamationCircleIcon,
            };
    }
}

function ToastCard({
    toast,
    onRemove,
}: {
    toast: ToastRecord;
    onRemove: (id: string) => void;
}) {
    const [visible, setVisible] = useState(false);
    const [remaining, setRemaining] = useState(toast.duration ?? DEFAULT_DURATION[toast.type]);
    const [pausedAt, setPausedAt] = useState<number | null>(null);

    const dismiss = useCallback(() => {
        setVisible(false);
        window.setTimeout(() => onRemove(toast.id), 220);
    }, [onRemove, toast.id]);

    const resume = useCallback(() => {
        if (pausedAt === null) {
            return;
        }

        const elapsed = Date.now() - pausedAt;
        const nextRemaining = Math.max(remaining - elapsed, 0);
        setRemaining(nextRemaining);
        setPausedAt(null);
    }, [pausedAt, remaining]);

    const pause = useCallback(() => {
        if (pausedAt !== null) {
            return;
        }

        setPausedAt(Date.now());
    }, [pausedAt, remaining]);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => setVisible(true));

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
        if (pausedAt !== null) {
            return;
        }

        const timeoutId = window.setTimeout(() => dismiss(), remaining);

        return () => window.clearTimeout(timeoutId);
    }, [dismiss, pausedAt, remaining]);

    const tone = toneClasses(toast.type);
    const Icon = tone.icon;
    const heading = toast.title ?? toast.type.charAt(0).toUpperCase() + toast.type.slice(1);

    return (
        <div
            onMouseEnter={pause}
            onMouseLeave={resume}
            className={`pointer-events-auto w-full max-w-sm rounded-[1.6rem] border px-4 py-4 backdrop-blur-2xl transition-all duration-200 ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            } ${tone.shell}`}
        >
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tone.iconWrap}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className={`text-[10px] font-bold uppercase tracking-[0.32em] ${tone.eyebrow}`}>
                        {heading}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/92">{toast.message}</p>
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                    aria-label="Dismiss notification"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastRecord[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((toast: ToastPayload) => {
        const id = toast.id ?? buildToastId();

        setToasts((current) => {
            const duplicate = current.some(
                (item) =>
                    item.type === toast.type &&
                    item.title === toast.title &&
                    item.message === toast.message,
            );

            if (duplicate) {
                return current;
            }

            return [
                ...current,
                {
                    ...toast,
                    id,
                },
            ];
        });

        return id;
    }, []);

    const value = useMemo(
        () => ({
            addToast,
            removeToast,
        }),
        [addToast, removeToast],
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed inset-x-4 top-4 z-[70] flex flex-col items-center gap-3 sm:left-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-sm sm:items-stretch">
                {toasts.map((toast) => (
                    <ToastCard key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within ToastProvider.');
    }

    return context;
}
