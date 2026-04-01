import { ToastPayload, ToastType, useToast } from '@/Components/ToastProvider';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef } from 'react';

type ExtendedPageProps = PageProps & {
    status?: string;
    errors?: Record<string, string>;
};

function normalizeFlashToasts(flash: ExtendedPageProps['flash']): ToastPayload[] {
    const toasts = [...(flash?.toasts ?? [])];

    const hasSuccessToast = toasts.some(
        (toast) => toast.type === 'success' && toast.message === flash?.success,
    );
    const hasErrorToast = toasts.some(
        (toast) => toast.type === 'error' && toast.message === flash?.error,
    );

    if (flash?.success && !hasSuccessToast) {
        toasts.push({
            type: 'success',
            message: flash.success,
            title: 'Success',
        });
    }

    if (flash?.error && !hasErrorToast) {
        toasts.push({
            type: 'error',
            message: flash.error,
            title: 'Action Required',
            duration: 6500,
        });
    }

    return toasts;
}

function createValidationToast(errors: Record<string, string> | undefined): ToastPayload | null {
    if (!errors || Object.keys(errors).length === 0) {
        return null;
    }

    return {
        type: 'error',
        title: 'Please review the highlighted fields',
        message: Object.values(errors)[0] || 'Please review the highlighted fields and try again.',
        duration: 6500,
    };
}

function createStatusToast(status?: string): ToastPayload | null {
    if (!status) {
        return null;
    }

    const lowerStatus = status.toLowerCase();
    let message = status;
    let title = 'Status';
    let type: ToastType = 'info';

    if (lowerStatus === 'verification-link-sent') {
        message = 'A new verification link has been sent to your email address.';
        title = 'Verification email sent';
        type = 'success';
    } else if (lowerStatus.includes('password')) {
        title = 'Password update';
        type = 'success';
    } else if (lowerStatus.includes('verification')) {
        title = 'Verification';
        type = 'info';
    } else {
        title = 'Status update';
        type = 'success';
    }

    return {
        type,
        title,
        message,
    };
}

export default function GlobalToastListener() {
    const page = usePage<ExtendedPageProps>();
    const { addToast } = useToast();
    const lastSignature = useRef('');

    const queue = useMemo(() => {
        const items = [...normalizeFlashToasts(page.props.flash)];
        const statusToast = createStatusToast(page.props.status);
        const validationToast = createValidationToast(page.props.errors);

        if (statusToast) {
            items.push(statusToast);
        }

        if (validationToast) {
            items.push(validationToast);
        }

        return items;
    }, [page.props.errors, page.props.flash, page.props.status]);

    useEffect(() => {
        const signature = JSON.stringify(queue);

        if (!queue.length) {
            lastSignature.current = '';
            return;
        }

        if (lastSignature.current === signature) {
            return;
        }

        lastSignature.current = signature;
        queue.forEach((toast, index) => {
            addToast({
                ...toast,
                id: `${page.url}:${toast.type}:${toast.title ?? 'notice'}:${toast.message}:${index}`,
            });
        });
    }, [addToast, page.url, queue]);

    return null;
}
