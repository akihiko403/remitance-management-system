import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import ModalFormShell from '@/Components/ModalFormShell';
import SectionHeading from '@/Components/SectionHeading';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <SectionHeading
                eyebrow="Critical Action"
                title="Delete account"
                description="Permanently remove this account and all associated resources. This action cannot be undone."
            />

            <DangerButton onClick={confirmUserDeletion}>
                Delete Account
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser}>
                    <ModalFormShell
                        eyebrow="Delete Account"
                        title="Confirm permanent account deletion"
                        description="Enter your password to confirm this irreversible operation."
                        onClose={closeModal}
                        footer={
                            <>
                                <SecondaryButton onClick={closeModal}>
                                    Cancel
                                </SecondaryButton>
                                <DangerButton disabled={processing}>
                                    Delete Account
                                </DangerButton>
                            </>
                        }
                    >
                        <div>
                            <InputLabel
                                htmlFor="password"
                                value="Password"
                            />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                className="w-full"
                                isFocused
                                placeholder="Current password"
                            />

                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </div>
                    </ModalFormShell>
                </form>
            </Modal>
        </section>
    );
}
