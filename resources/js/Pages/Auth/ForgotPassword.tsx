import InputError from '@/Components/InputError';
import SectionHeading from '@/Components/SectionHeading';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword(_props: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <SectionHeading
                eyebrow="Account Recovery"
                title="Reset your Fightline access"
                description="Enter your account email and we will send a secure password reset link for the Fightline workspace."
            />
            <form onSubmit={submit} className="mt-8 space-y-6">
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="w-full"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="Email address"
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>
                        Email Password Reset Link
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
