import BrandLogo from '@/Components/BrandLogo';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({
    auth,
}: {
    auth: {
        user: { name: string } | null;
    };
}) {
    return (
        <>
            <Head title="Welcome" />
            <div className="relative min-h-screen overflow-hidden bg-shell text-kgbi-silver">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,40,37,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(8,37,67,0.34),transparent_28%)]" />

                <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
                    <header className="flex items-center justify-between gap-4">
                        <BrandLogo variant="primary" className="max-w-[15rem] sm:max-w-[18rem]" />
                        <div className="action-group">
                            {auth.user ? (
                                <Link href={route('dashboard')} className="glass-button">
                                    Open Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="glass-button-secondary">
                                        Log In
                                    </Link>
                                    <Link href={route('register')} className="glass-button">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </header>

                    <main className="grid flex-1 items-center gap-10 py-10 xl:grid-cols-[1.05fr_0.95fr]">
                        <section className="space-y-8">
                            <div className="section-eyebrow">Fightline Operations Platform</div>
                            <div className="max-w-4xl text-5xl font-semibold leading-tight text-white lg:text-6xl">
                                Fightline gives finance teams a cleaner way to run remittance, shortage recovery, and payment tracking at scale.
                            </div>
                            <p className="max-w-2xl text-base leading-8 text-slate-300/70">
                                Fightline unifies event attendance, teller assignments, remittance encoding, deductions, and audit visibility into one dark command surface built for fast daily operations.
                            </p>

                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    ['Roster Control', 'Centralized people and event attendance assignments.'],
                                    ['Remittance Flow', 'Per-person event encoding with automatic shortage tracking.'],
                                    ['Recovery Visibility', 'Consolidated payments, balances, and deduction history.'],
                                ].map(([title, copy]) => (
                                    <div key={title} className="app-surface panel-pad">
                                        <div className="text-sm font-semibold text-white">{title}</div>
                                        <div className="mt-3 text-sm leading-7 text-slate-300/70">{copy}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="app-surface panel-pad">
                            <div className="section-eyebrow">Platform Highlights</div>
                            <div className="section-title">Fightline operating stack</div>
                            <div className="mt-8 grid gap-4">
                                {[
                                    ['Role-based access', 'Controlled views for admin, encoder, auditor, and operations users.'],
                                    ['Running balances', 'Track remittance shortages and remaining exposure with less manual work.'],
                                    ['Cash recovery', 'Post partial payments until every outstanding balance is fully cleared.'],
                                    ['Audit visibility', 'Monitor operational changes and account activity from one timeline.'],
                                ].map(([title, copy]) => (
                                    <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <div className="text-lg font-semibold text-white">{title}</div>
                                        <div className="mt-2 text-sm leading-7 text-kgbi-silver/70">{copy}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}
