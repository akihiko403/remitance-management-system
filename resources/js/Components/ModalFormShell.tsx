import SectionHeading from '@/Components/SectionHeading';
import { PropsWithChildren, ReactNode } from 'react';

export default function ModalFormShell({
    title,
    eyebrow,
    description,
    headerAside,
    footer,
    onClose,
    children,
}: PropsWithChildren<{
    title: string;
    eyebrow?: string;
    description?: ReactNode;
    headerAside?: ReactNode;
    footer?: ReactNode;
    onClose?: () => void;
}>) {
    return (
        <>
            <div className="modal-header">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                        <SectionHeading
                            eyebrow={eyebrow}
                            title={title}
                            description={description}
                            className="min-w-0 flex-1"
                        />
                        {headerAside ? (
                            <div className="hidden shrink-0 self-center md:block">{headerAside}</div>
                        ) : null}
                    </div>
                    <div className="flex shrink-0 items-start gap-3">
                        {headerAside ? (
                            <div className="shrink-0 self-center md:hidden">{headerAside}</div>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="modal-body">
                <div className="space-y-4">{children}</div>
            </div>
            {footer ? <div className="modal-footer">{footer}</div> : null}
        </>
    );
}
