import PrimaryButton from '@/Components/PrimaryButton';
import SectionHeading from '@/Components/SectionHeading';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail(_props: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <SectionHeading
                eyebrow="Verification"
                title="Confirm your email address"
                description="Before using the workspace, verify your email from the link we sent. You can request another message if needed."
            />
            <form onSubmit={submit} className="mt-8">
                <div className="action-group justify-between">
                    <PrimaryButton disabled={processing}>
                        Resend Verification Email
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="glass-button-secondary"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
