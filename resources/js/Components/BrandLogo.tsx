import { cn } from '@/lib/utils';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

type BrandLogoProps = {
    variant?: 'primary' | 'clean' | 'compact';
    surface?: 'dark' | 'light';
    className?: string;
};

export default function BrandLogo({
    variant = 'primary',
    surface = 'dark',
    className,
}: BrandLogoProps) {
    const { app } = usePage<PageProps>().props;

    if (variant === 'compact') {
        return (
            <img
                src={surface === 'dark' ? app.compactLogoUrl : app.compactLogoColorUrl}
                alt={`${app.brandName} icon`}
                className={cn('h-11 w-11 object-contain', className)}
            />
        );
    }

    const src = variant === 'clean'
        ? app.cleanWordmarkWhiteUrl
        : surface === 'dark'
            ? app.wordmarkWhiteUrl
            : app.primaryLogoUrl;

    return (
        <img
            src={src}
            alt={`${app.brandName} logo`}
            className={cn(
                'h-11 w-auto object-contain sm:h-12',
                variant === 'primary' ? 'max-w-[18rem] sm:max-w-[22rem]' : 'max-w-[15rem] sm:max-w-[18rem]',
                className,
            )}
        />
    );
}
