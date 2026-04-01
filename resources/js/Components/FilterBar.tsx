import { cn } from '@/lib/utils';
import { PropsWithChildren } from 'react';

export default function FilterBar({
    children,
    className,
}: PropsWithChildren<{ className?: string }>) {
    return <div className={cn('filter-bar', className)}>{children}</div>;
}
