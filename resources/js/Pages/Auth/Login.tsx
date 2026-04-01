import GuestLayout from '@/Layouts/GuestLayout';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: 'admin@kgbi.local',
        password: 'password',
        remember: true as boolean,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Command Center Login" />

            <GuestLayout>
                <div className="mb-11">
                    <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3b82f6]">
                        FightLine Command Center
                    </div>
                    <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                        Welcome Back
                    </h1>
                    <p className="mt-4 max-w-sm text-lg leading-8 text-slate-400">
                        Sign in to access your operations workspace.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-7">
                    <div>
                        <label className="mb-3 block text-sm font-semibold text-slate-300">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                            className="h-14 w-full rounded-2xl border border-white/10 bg-[#1c2741] px-5 text-lg text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-[#3b82f6]/60 focus:ring-4 focus:ring-[#3b82f6]/12"
                            placeholder="admin@kgbi.local"
                            autoComplete="username"
                        />
                        {errors.email ? <div className="form-error">{errors.email}</div> : null}
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-4">
                            <label className="block text-sm font-semibold text-slate-300">
                                Password
                            </label>
                            {canResetPassword ? (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm font-medium text-[#60a5fa] transition-colors hover:text-[#93c5fd]"
                                >
                                    Forgot?
                                </Link>
                            ) : null}
                        </div>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            className="h-14 w-full rounded-2xl border border-white/10 bg-[#1c2741] px-5 text-lg text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-[#3b82f6]/60 focus:ring-4 focus:ring-[#3b82f6]/12"
                            placeholder="••••••••••"
                            autoComplete="current-password"
                        />
                        {errors.password ? (
                            <div className="form-error">{errors.password}</div>
                        ) : null}
                    </div>

                    <label className="flex items-center gap-3 text-base font-medium text-slate-400">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(event) => setData('remember', event.target.checked)}
                            className="h-6 w-6 rounded-[0.35rem] border border-white/10 bg-[#1c2741] text-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/15 focus:ring-offset-0"
                        />
                        Keep this session active
                    </label>

                    <button
                        type="submit"
                        disabled={processing}
                        className="group inline-flex min-h-[4.75rem] w-full items-center justify-center gap-3 rounded-[1.15rem] bg-gradient-to-r from-[#2563eb] to-[#315eea] px-6 py-4 text-lg font-bold text-white shadow-[0_22px_46px_rgba(37,99,235,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#2d6af0] hover:to-[#3a66f0] hover:shadow-[0_26px_56px_rgba(37,99,235,0.34)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? 'Authenticating...' : 'Enter Dashboard'}
                        <ArrowRightIcon className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                </form>

                <div className="mt-14 flex items-center justify-between gap-4 border-t border-white/8 pt-8 text-sm text-slate-500">
                    <p>&copy; 2024 FightLine Systems</p>
                    <div className="flex items-center gap-6">
                        <span>Privacy</span>
                        <span>Support</span>
                    </div>
                </div>
            </GuestLayout>
        </>
    );
}
