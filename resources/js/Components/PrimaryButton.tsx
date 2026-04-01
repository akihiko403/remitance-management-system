import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={cn('glass-button', className)}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
