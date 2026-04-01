import GlobalToastListener from '@/Components/GlobalToastListener';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function GuestLayout({ children }: PropsWithChildren) {
    const { app } = usePage<PageProps>().props;

    return (
        <div className="relative overflow-hidden bg-[#060b1d]">
            <GlobalToastListener />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_34%),linear-gradient(180deg,#050a18_0%,#071126_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(37,99,235,0.18),transparent)]" />
            <div className="relative mx-auto flex min-h-screen items-center justify-center px-4 py-6 lg:px-8">
                <div className="relative grid min-h-[720px] w-full max-w-[1120px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#121a33] shadow-[0_34px_90px_rgba(0,0,0,0.48)] md:grid-cols-[1.02fr_0.98fr]">
                    <div className="hidden border-r border-white/5 bg-[linear-gradient(180deg,#141d37_0%,#121a31_100%)] md:flex md:flex-col md:justify-between md:p-14">
                        <div className="relative z-10">
                            <div className="flex justify-center">
                                <div className="relative inline-flex rounded-[1.75rem] border border-white/8 bg-white/[0.03] px-8 py-6 shadow-[0_24px_50px_rgba(0,0,0,0.24)]">
                                    <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.12),transparent_38%)]" />
                                    <img
                                        src="/fightline/logo-with-text-white.svg"
                                        alt={`${app.brandName} logo`}
                                        className="relative h-20 w-auto object-contain"
                                    />
                                </div>
                            </div>

                            <div className="mt-16 max-w-xl">
                                <h1 className="text-6xl font-extrabold leading-[0.98] tracking-tight text-white">
                                    Precision
                                    <br />
                                    <span className="text-[#3b82f6]">Betting</span>
                                    <br />
                                    Operations.
                                </h1>
                                <p className="mt-8 max-w-[30rem] text-[1.02rem] leading-9 text-slate-400">
                                    The ultimate command center for high-visibility event finance,
                                    remittances, and recovery activity.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-6">
                            {[
                                'Real-time volume tracking',
                                'Automated balance recovery',
                                'Audit-ready reporting',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-4 text-slate-200">
                                    <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#3b82f6] shadow-[0_0_14px_rgba(59,130,246,0.75)]" />
                                    <span className="text-[1.06rem] font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex min-h-[44rem] items-center bg-[linear-gradient(180deg,#171f38_0%,#1b2440_100%)] px-6 py-10 sm:px-10 lg:px-16">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_28%)]" />
                        <div className="relative z-10 mx-auto w-full max-w-md">
                            <div className="mb-10 flex justify-center md:hidden">
                                <img
                                    src="/fightline/logo-with-text-white.svg"
                                    alt={`${app.brandName} logo`}
                                    className="h-12 w-auto object-contain"
                                />
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
