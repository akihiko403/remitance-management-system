import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={cn('glass-button-danger', className)}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
