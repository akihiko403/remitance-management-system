import { cn } from '@/lib/utils';
import { PropsWithChildren } from 'react';

export default function GlassPanel({
    children,
    className,
}: PropsWithChildren<{ className?: string }>) {
    return (
        <div
            className={cn(
                'dashboard-panel',
                className,
            )}
        >
            {children}
        </div>
    );
}
