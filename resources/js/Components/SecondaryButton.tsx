import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={cn('glass-button-secondary', className)}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
