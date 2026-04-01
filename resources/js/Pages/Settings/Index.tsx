import BrandLogo from '@/Components/BrandLogo';
import GlassPanel from '@/Components/GlassPanel';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';

type Props = {
    settings: {
        organization_name: string;
        system_name: string;
        support_email?: string | null;
        support_phone?: string | null;
        finance_note?: string | null;
        primary_logo_path: string;
        dark_wordmark_path: string;
        clean_wordmark_path: string;
        compact_logo_path: string;
        icon_path: string;
    };
    users: {
        id: number;
        name: string;
        email: string;
        job_title?: string | null;
        roles: string[];
        is_active: boolean;
        last_login_at?: string | null;
    }[];
    roles: string[];
    roleMatrix: Record<string, string[]>;
};

export default function SettingsIndex({
    settings,
    users,
    roles,
    roleMatrix,
}: Props) {
    const form = useForm({
        organization_name: settings.organization_name,
        system_name: settings.system_name,
        support_email: settings.support_email ?? '',
        support_phone: settings.support_phone ?? '',
        finance_note: settings.finance_note ?? '',
    });

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow="Settings"
                    title="Fightline system profile and access control"
                    description="Manage the operational metadata shown around the bundled Fightline brand system, plus role access for every account."
                />
            }
        >
            <Head title="Settings" />

            <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                <GlassPanel>
                    <div className="text-xs uppercase tracking-[0.35em] text-kgbi-gold/70">
                        Brand System
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-white">
                        Bundled Fightline asset pack
                    </div>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                        The application now uses the bundled Fightline logo system from the public asset pack.
                        Brand uploads are no longer the primary source of identity, so this screen now focuses on
                        operational metadata and live previews.
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <div className="mb-4 text-sm text-slate-300">
                                Primary wordmark
                            </div>
                            <img
                                src={settings.primary_logo_path}
                                alt="Fightline primary wordmark"
                                className="max-h-80 w-full rounded-3xl border border-white/10 bg-[#10192f] p-4 object-contain"
                            />
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-[#10192f] p-5">
                            <div className="mb-4 text-sm text-slate-300">
                                Dark surface wordmark
                            </div>
                            <img
                                src={settings.dark_wordmark_path}
                                alt="Fightline dark wordmark"
                                className="max-h-80 w-full rounded-3xl border border-white/10 bg-[#0b1224] p-4 object-contain"
                            />
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-[#10192f] p-5">
                            <div className="mb-4 text-sm text-slate-300">
                                Clean dark wordmark
                            </div>
                            <img
                                src={settings.clean_wordmark_path}
                                alt="Fightline clean wordmark"
                                className="max-h-80 w-full rounded-3xl border border-white/10 bg-[#0b1224] p-4 object-contain"
                            />
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <div className="mb-4 text-sm text-slate-300">
                                Compact app icon
                            </div>
                            <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-[#10192f] p-10">
                                <img
                                    src={settings.compact_logo_path}
                                    alt="Fightline compact icon"
                                    className="h-24 w-24 object-contain"
                                />
                            </div>
                            <div className="mt-4 flex items-center gap-4 rounded-3xl border border-white/10 bg-[#10192f] p-4">
                                <img
                                    src={settings.icon_path}
                                    alt="Fightline app icon"
                                    className="h-16 w-16 rounded-2xl border border-white/10 bg-[#0b1224] object-contain p-2"
                                />
                                <div>
                                    <div className="text-sm font-semibold text-white">App icon pack</div>
                                    <div className="mt-1 text-sm text-slate-300">
                                        Used for browser and installable app surfaces.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.patch(route('settings.update'), {
                                preserveScroll: true,
                            });
                        }}
                        className="mt-6 space-y-4"
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                className="glass-input"
                                placeholder="Organization name"
                                value={form.data.organization_name}
                                onChange={(event) =>
                                    form.setData('organization_name', event.target.value)
                                }
                            />
                            <input
                                className="glass-input"
                                placeholder="System name"
                                value={form.data.system_name}
                                onChange={(event) =>
                                    form.setData('system_name', event.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                className="glass-input"
                                placeholder="Support email"
                                value={form.data.support_email}
                                onChange={(event) =>
                                    form.setData('support_email', event.target.value)
                                }
                            />
                            <input
                                className="glass-input"
                                placeholder="Support phone"
                                value={form.data.support_phone}
                                onChange={(event) =>
                                    form.setData('support_phone', event.target.value)
                                }
                            />
                        </div>
                        <textarea
                            className="glass-input min-h-28"
                            placeholder="Finance note"
                            value={form.data.finance_note}
                            onChange={(event) => form.setData('finance_note', event.target.value)}
                        />

                        {Object.values(form.errors).length ? (
                            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                {Object.values(form.errors)[0]}
                            </div>
                        ) : null}

                        <button type="submit" className="glass-button">
                            Save Settings
                        </button>
                    </form>
                </GlassPanel>

                <div className="space-y-6">
                    <GlassPanel>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs uppercase tracking-[0.35em] text-kgbi-gold/70">
                                    Live Preview
                                </div>
                                <div className="mt-2 text-2xl font-extrabold text-white">
                                    Navigation lockups
                                </div>
                            </div>
                            <BrandLogo variant="compact" />
                        </div>

                        <div className="mt-6 space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
                            <BrandLogo variant="primary" />
                            <BrandLogo variant="clean" />
                        </div>
                    </GlassPanel>

                    <GlassPanel>
                        <div className="text-xs uppercase tracking-[0.35em] text-kgbi-gold/70">
                            Access Control
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-white">
                            Role assignment matrix
                        </div>
                        <div className="mt-6 space-y-4">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="rounded-3xl border border-white/10 bg-white/5 p-5"
                                >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="text-lg font-semibold text-white">
                                                {user.name}
                                            </div>
                                            <div className="text-sm text-slate-300">
                                                {user.email} | {user.job_title || 'No title'}
                                            </div>
                                            <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                                                Last login: {user.last_login_at || 'No login yet'}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <select
                                                className="glass-select min-w-44"
                                                defaultValue={user.roles[0] ?? roles[0]}
                                                onChange={(event) =>
                                                    router.patch(
                                                        route('settings.users.update-role', user.id),
                                                        {
                                                            role: event.target.value,
                                                            is_active: user.is_active ? 1 : 0,
                                                        },
                                                        { preserveScroll: true },
                                                    )
                                                }
                                            >
                                                {roles.map((role) => (
                                                    <option key={role} value={role}>
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.patch(
                                                        route('settings.users.update-role', user.id),
                                                        {
                                                            role: user.roles[0] ?? roles[0],
                                                            is_active: user.is_active ? 0 : 1,
                                                        },
                                                        { preserveScroll: true },
                                                    )
                                                }
                                                className="glass-button-secondary"
                                            >
                                                {user.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-sm text-slate-300">
                                        Permissions: {(roleMatrix[user.roles[0] ?? roles[0]] || []).join(', ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassPanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
