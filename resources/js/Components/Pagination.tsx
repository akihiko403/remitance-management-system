import { cn } from '@/lib/utils';
import { PaginationLink as PaginationLinkType } from '@/types';
import { Link } from '@inertiajs/react';

export default function Pagination({
    links = [],
}: {
    links?: PaginationLinkType[];
}) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        className={cn(
                            'inline-flex min-h-[2.75rem] items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-200',
                            link.active
                                ? 'border-blue-400/40 bg-blue-500/20 text-blue-100 shadow-[0_12px_24px_rgba(59,130,246,0.18)]'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:-translate-y-0.5 hover:border-blue-400/35 hover:bg-blue-500/10 hover:text-white',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="inline-flex min-h-[2.75rem] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </div>
    );
}
