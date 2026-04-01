import { cn } from '@/lib/utils';
import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={cn(
                'flex w-full items-center rounded-xl border px-4 py-3 text-sm font-medium transition duration-150 ease-in-out focus:outline-none',
                active
                    ? 'border-rose-500/40 bg-rose-500/14 text-white'
                    : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600 hover:text-white',
                className,
            )}
        >
            {children}
        </Link>
    );
}
