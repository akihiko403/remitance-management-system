import { cn } from '@/lib/utils';
import { PropsWithChildren, ReactNode } from 'react';

export default function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    className,
}: PropsWithChildren<{
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}>) {
    return (
        <div className={cn('flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between', className)}>
            <div className="max-w-4xl">
                {eyebrow ? (
                    <div className="page-eyebrow">
                        {eyebrow}
                    </div>
                ) : null}
                <h1 className="page-title">
                    {title}
                </h1>
                {description ? (
                    <p className="page-copy">
                        {description}
                    </p>
                ) : null}
            </div>
            {actions ? <div className="action-group lg:justify-end">{actions}</div> : null}
        </div>
    );
}
