import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export default function SectionHeading({
    eyebrow,
    title,
    description,
    actions,
    className,
}: {
    eyebrow?: string;
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between',
                className,
            )}
        >
            <div className="min-w-0">
                {eyebrow ? <div className="section-eyebrow">{eyebrow}</div> : null}
                <h2 className="section-title">{title}</h2>
                {description ? <div className="section-copy">{description}</div> : null}
            </div>
            {actions ? <div className="action-group">{actions}</div> : null}
        </div>
    );
}
