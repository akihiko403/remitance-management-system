export default function ApplicationLogo({
    className = '',
}: {
    className?: string;
}) {
    return (
        <img
            src="/fightline/logo-only.svg"
            alt="Fightline"
            className={className}
        />
    );
}
