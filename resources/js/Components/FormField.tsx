import InputError from '@/Components/InputError';
import { cn } from '@/lib/utils';
import { PropsWithChildren, ReactNode } from 'react';

export default function FormField({
    label,
    error,
    helper,
    className,
    children,
}: PropsWithChildren<{
    label?: ReactNode;
    error?: string;
    helper?: string;
    className?: string;
}>) {
    return (
        <div className={cn('min-w-0', className)}>
            {label ? <label className="form-label">{label}</label> : null}
            {children}
            {helper ? <div className="form-help">{helper}</div> : null}
            <InputError message={error} className="form-error" />
        </div>
    );
}
