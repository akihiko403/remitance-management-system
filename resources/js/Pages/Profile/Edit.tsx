import GlassPanel from '@/Components/GlassPanel';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow="Account Profile"
                    title="Manage your user profile and security settings"
                    description="Maintain your administrator identity, update your password, and manage account-level access safeguards."
                />
            }
        >
            <Head title="Profile" />

            <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
                <div className="space-y-6">
                    <GlassPanel>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-2xl"
                        />
                    </GlassPanel>

                    <GlassPanel>
                        <DeleteUserForm className="max-w-2xl" />
                    </GlassPanel>
                </div>

                <GlassPanel>
                    <UpdatePasswordForm className="max-w-2xl" />
                </GlassPanel>
                </div>
        </AuthenticatedLayout>
    );
}
