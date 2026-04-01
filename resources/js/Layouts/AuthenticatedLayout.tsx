import GlobalToastListener from '@/Components/GlobalToastListener';
import { navigationGroups } from '@/config/navigation';
import { cn, hasPermission } from '@/lib/utils';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftOnRectangleIcon,
    Bars3Icon,
    BellIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    Cog6ToothIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useState } from 'react';

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, app, activeEvent } = usePage<PageProps>().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        setDesktopCollapsed(
            window.localStorage.getItem('fightline-sidebar-collapsed') === '1',
        );
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(
            'fightline-sidebar-collapsed',
            desktopCollapsed ? '1' : '0',
        );
    }, [desktopCollapsed]);

    const groups = useMemo(
        () =>
            navigationGroups
                .map((group) => ({
                    ...group,
                    items: group.items.filter((item) =>
                        hasPermission(auth.user?.permissions, item.permission),
                    ),
                }))
                .filter((group) => group.items.length),
        [auth.user?.permissions],
    );

    const closeMobile = () => setMobileOpen(false);

    const renderSidebar = (collapsed = false, mobile = false) => (
        <aside
            className={cn(
                'sidebar-shell relative flex h-full max-h-screen flex-col overflow-hidden shadow-[0_28px_60px_rgba(15,23,42,0.24)] transition-all duration-300 ease-in-out',
                collapsed ? 'items-center px-3 py-4' : 'px-4 pb-4 pt-5',
            )}
        >
            <div className="w-full border-b border-slate-800/80 pb-4">
                <div
                    className={cn(
                        'flex items-start justify-between gap-3',
                        collapsed && 'justify-center',
                    )}
                >
                    <div
                        className={cn(
                            'min-w-0 transition-all duration-300 ease-in-out',
                            collapsed
                                ? 'flex justify-center'
                                : 'flex items-center gap-3',
                        )}
                    >
                        {collapsed ? (
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 shadow-lg">
                                <img
                                    src={app.compactLogoUrl}
                                    alt={`${app.brandName} icon`}
                                    className="h-8 w-8 object-contain"
                                />
                            </div>
                        ) : (
                            <div className="min-w-0 w-full text-center">
                                <div className="min-w-0 flex flex-col items-center">
                                    <img
                                        src={app.cleanWordmarkWhiteUrl}
                                        alt={`${app.brandName} logo`}
                                        className="h-9 w-auto max-w-[13rem] object-contain"
                                    />
                                    <div className="mt-1 text-[11px] text-slate-400">
                                        {app.tagline}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {mobile ? (
                        <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
                            onClick={closeMobile}
                            aria-label="Close navigation"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="mt-5 flex min-h-0 w-full flex-1 flex-col">
                <div
                    className={cn(
                        'sidebar-scroll min-h-0 flex-1 space-y-6 overflow-y-auto pr-1',
                        collapsed && 'pr-0',
                    )}
                >
                    {groups.map((group) => (
                        <div key={group.key} className="space-y-2">
                            {!collapsed ? (
                                <div className="sidebar-group-title">{group.label}</div>
                            ) : null}
                            <div
                                className={cn(
                                    'space-y-1.5',
                                    collapsed && 'flex flex-col items-center',
                                )}
                            >
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = route().current(item.match);

                                    return (
                                        <Link
                                            key={item.key}
                                            href={route(item.route)}
                                            title={collapsed ? item.label : undefined}
                                            className={cn(
                                                'sidebar-nav-link',
                                                active &&
                                                    'sidebar-nav-link-active',
                                                collapsed &&
                                                    'sidebar-nav-link-collapsed',
                                            )}
                                            onClick={closeMobile}
                                        >
                                            <Icon className="sidebar-nav-icon" />
                                            {!collapsed ? (
                                                <span className="truncate">
                                                    {item.label}
                                                </span>
                                            ) : null}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-5 w-full shrink-0 border-t border-slate-800/80 pt-4">
                <div
                    className={cn(
                        'rounded-[1.6rem] border border-white/10 bg-white/5 shadow-inner shadow-black/10',
                        collapsed ? 'p-2.5' : 'p-3.5',
                    )}
                >
                    <div
                        className={cn(
                            'flex items-center gap-3',
                            collapsed && 'justify-center',
                        )}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e62825] to-[#ff4444] text-sm font-bold text-white">
                            {(auth.user?.name ?? 'U').slice(0, 1).toUpperCase()}
                        </div>
                        {!collapsed ? (
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-white">
                                    {auth.user?.name ?? 'FightLine User'}
                                </div>
                                <div className="truncate text-xs text-slate-400">
                                    {auth.user?.job_title || auth.user?.email}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div
                        className={cn(
                            'mt-3 grid gap-2',
                            collapsed ? 'grid-cols-1' : 'grid-cols-2',
                        )}
                    >
                        <Link
                            href={route('profile.edit')}
                            className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-white/10"
                            onClick={closeMobile}
                        >
                            <UserCircleIcon className="h-4 w-4" />
                            {!collapsed ? 'Profile' : null}
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-[1rem] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition-all duration-200 hover:bg-red-500/20"
                        >
                            <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                            {!collapsed ? 'Logout' : null}
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <div className="min-h-screen bg-shell text-slate-100">
            <GlobalToastListener />
            <div className="pointer-events-none fixed inset-0 shell-backdrop" />
            <div className="relative min-h-screen">
                <div
                    className={cn(
                        'fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-300 ease-in-out lg:block',
                        desktopCollapsed ? 'w-[5.5rem]' : 'w-[18rem]',
                    )}
                >
                    {renderSidebar(desktopCollapsed)}
                </div>

                {mobileOpen ? (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <div
                            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                            onClick={closeMobile}
                        />
                        <div className="absolute inset-y-0 left-0 w-[calc(100vw-1rem)] max-w-[20rem] sm:w-[18.5rem]">
                            {renderSidebar(false, true)}
                        </div>
                    </div>
                ) : null}

                <div
                    className={cn(
                        'flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ease-in-out',
                        desktopCollapsed ? 'lg:pl-[5.5rem]' : 'lg:pl-[18rem]',
                    )}
                >
                    <div className="sticky top-0 z-30 px-4 py-4 sm:px-6 lg:px-8">
                        <div className="topbar-shell">
                            <div className="relative flex items-center gap-3 px-4 py-3 sm:px-5 lg:px-6">
                                <button
                                    type="button"
                                    className="topbar-control lg:hidden"
                                    onClick={() => setMobileOpen((value) => !value)}
                                >
                                    {mobileOpen ? (
                                        <XMarkIcon className="h-5 w-5" />
                                    ) : (
                                        <Bars3Icon className="h-5 w-5" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="topbar-control hidden lg:inline-flex"
                                    onClick={() =>
                                        setDesktopCollapsed((value) => !value)
                                    }
                                    aria-label={
                                        desktopCollapsed
                                            ? 'Expand sidebar'
                                            : 'Collapse sidebar'
                                    }
                                >
                                    {desktopCollapsed ? (
                                        <ChevronDoubleRightIcon className="h-5 w-5" />
                                    ) : (
                                        <ChevronDoubleLeftIcon className="h-5 w-5" />
                                    )}
                                </button>
                                <div className="min-w-0 flex-1">
                                    <label className="topbar-search">
                                        <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-slate-400" />
                                        <input
                                            type="text"
                                            className="w-full border-0 bg-transparent p-0 text-[15px] text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:outline-none focus:ring-0"
                                            placeholder="Search people, events, remittances, or reports"
                                            aria-label="Search operations workspace"
                                        />
                                    </label>
                                </div>

                                <div className="hidden items-center gap-3 xl:flex">
                                    <button
                                        type="button"
                                        className="topbar-control relative"
                                        aria-label="Notifications"
                                    >
                                        <BellIcon className="h-5 w-5" />
                                        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#ff6b63] shadow-[0_0_0_4px_rgba(255,107,99,0.14)]" />
                                    </button>
                                    <Link
                                        href={route('settings.index')}
                                        className="topbar-control"
                                        aria-label="Open settings"
                                    >
                                        <Cog6ToothIcon className="h-5 w-5" />
                                    </Link>

                                    {activeEvent ? (
                                        <div className="topbar-chip min-w-[12rem]">
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-400">
                                                Active Event
                                            </div>
                                            <div className="mt-1 truncate text-sm font-semibold text-white">
                                                {activeEvent.name}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="topbar-chip text-right">
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                                                Event Status
                                            </div>
                                            <div className="mt-1 text-sm font-medium text-slate-400">
                                                No active event
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <main className="relative flex-1 px-4 pb-8 pt-2 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl space-y-6">
                            {header}
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
