import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getSemanticToneClasses, type ToneName } from '../semanticTones';

const mergeClasses = (...values: Array<string | false | null | undefined>) =>
    values.filter(Boolean).join(' ');

type SettingsTone = ToneName;

type SettingsPageProps = {
    children: React.ReactNode;
};

type SettingsBackLinkProps = {
    href: string;
    label: string;
};

type SettingsHeroProps = {
    actions?: React.ReactNode;
    description: string;
    eyebrow?: string;
    highlights?: readonly string[];
    icon: React.ReactNode;
    title: string;
    tone?: SettingsTone;
};

type SettingsSectionCardProps = {
    badge?: string;
    children: React.ReactNode;
    className?: string;
    description?: string;
    icon?: React.ReactNode;
    title: string;
    tone?: SettingsTone;
};

type SettingsActionRowProps = {
    actionLabel?: string;
    className?: string;
    description: string;
    href?: string;
    icon: React.ReactNode;
    onClick?: () => void;
    status?: string;
    title: string;
    tone?: SettingsTone;
};

type SettingsStatusBannerProps = {
    action?: React.ReactNode;
    badge?: string;
    description: string;
    helperText?: string;
    icon?: React.ReactNode;
    title: string;
    tone?: SettingsTone;
};

type SettingsEmptyStateProps = {
    action?: React.ReactNode;
    description: string;
    icon?: React.ReactNode;
    title: string;
    tone?: SettingsTone;
};

type SettingsDangerPanelProps = {
    children?: React.ReactNode;
    description: string;
    icon?: React.ReactNode;
    title: string;
};

type SettingsToggleRowProps = {
    checked: boolean;
    checkedLabel?: string;
    description: string;
    disabled?: boolean;
    helperText?: string;
    icon?: React.ReactNode;
    onChange: (checked: boolean) => void;
    title: string;
    tone?: SettingsTone;
    uncheckedLabel?: string;
};

export const SettingsPage = ({ children }: SettingsPageProps) => (
    <main className="flex-grow w-full">
        <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6 sm:pt-8 lg:px-8">{children}</div>
    </main>
);

export const SettingsBackLink = ({ href, label }: SettingsBackLinkProps) => (
    <Link
        href={href}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-line/40 bg-surface/60 px-4 py-2 text-sm font-medium text-faint transition hover:border-line/60 hover:bg-surface-secondary/70 hover:text-foreground"
    >
        <ArrowLeft size={16} />
        <span>{label}</span>
    </Link>
);

export const SettingsHero = ({
    actions,
    description,
    eyebrow,
    highlights,
    icon,
    title,
    tone = 'brand',
}: SettingsHeroProps) => {
    const toneClassName = getSemanticToneClasses(tone);
    const heroToneStyle = {
        '--settings-hero-primary-rgb': `var(${toneClassName.heroPrimaryToken})`,
        '--settings-hero-secondary-rgb': `var(${toneClassName.heroSecondaryToken})`,
    } as React.CSSProperties;

    return (
        <section className="relative overflow-hidden rounded-[28px] border border-line/30 bg-surface/75 px-6 py-8 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:px-8 lg:px-10" style={heroToneStyle}>
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at top right, rgb(var(--settings-hero-primary-rgb) / 0.18) 0%, transparent 34%), radial-gradient(circle at bottom left, rgb(var(--settings-hero-secondary-rgb) / 0.12) 0%, transparent 24%)',
                }}
            />
            <div className="relative flex min-w-0 flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 max-w-3xl space-y-5">
                    {eyebrow ? (
                        <span className={mergeClasses('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]', toneClassName.badge)}>
                            {eyebrow}
                        </span>
                    ) : null}
                    <div className="flex min-w-0 items-start gap-4">
                        <div className={mergeClasses('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-lg shadow-black/5', toneClassName.icon)}>
                            {icon}
                        </div>
                        <div className="min-w-0 space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem]">{title}</h1>
                            <p className="max-w-2xl text-base leading-7 text-faint sm:text-lg">{description}</p>
                        </div>
                    </div>
                    {highlights && highlights.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {highlights.map((highlight) => (
                                <span
                                    key={highlight}
                                    className="rounded-full border border-line/35 bg-surface-secondary/55 px-3 py-1.5 text-sm text-muted"
                                >
                                    {highlight}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>
                {actions ? <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">{actions}</div> : null}
            </div>
        </section>
    );
};

export const SettingsSectionCard = ({
    badge,
    children,
    className,
    description,
    icon,
    title,
    tone = 'brand',
}: SettingsSectionCardProps) => {
    const toneClassName = getSemanticToneClasses(tone);

    return (
        <section className={mergeClasses('rounded-[26px] border border-line/30 bg-surface/75 p-5 shadow-[0_18px_50px_-26px_rgba(15,23,42,0.4)] backdrop-blur-sm sm:p-6', className)}>
            <div className="mb-5 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    {icon ? (
                        <div className={mergeClasses('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10', toneClassName.icon)}>
                            {icon}
                        </div>
                    ) : null}
                    <div className="min-w-0 space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
                        {description ? <p className="max-w-2xl text-sm leading-6 text-faint">{description}</p> : null}
                    </div>
                </div>
                {badge ? (
                    <span className={mergeClasses('self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', toneClassName.badge)}>
                        {badge}
                    </span>
                ) : null}
            </div>
            <div className="space-y-3">{children}</div>
        </section>
    );
};

export const SettingsActionRow = ({
    actionLabel = 'Open',
    className,
    description,
    href,
    icon,
    onClick,
    status,
    title,
    tone = 'brand',
}: SettingsActionRowProps) => {
    const toneClassName = getSemanticToneClasses(tone);
    const baseClassName = mergeClasses(
        'group relative block overflow-hidden rounded-2xl border border-line/25 bg-surface-secondary/45 p-4 transition duration-200 hover:bg-surface-secondary/70',
        toneClassName.row,
        className,
    );
    const content = (
        <>
            <div className="flex min-w-0 items-start gap-4">
                <div className={mergeClasses('mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10', toneClassName.icon)}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-foreground">{title}</h3>
                            <p className="mt-1 max-w-xl text-sm leading-6 text-faint">{description}</p>
                        </div>
                        {status ? (
                            <span className={mergeClasses('self-start rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', toneClassName.badge)}>
                                {status}
                            </span>
                        ) : null}
                    </div>
                </div>
                <div className="hidden shrink-0 items-center gap-2 text-sm font-medium text-muted transition group-hover:text-foreground sm:flex">
                    <span>{actionLabel}</span>
                    <ChevronRight size={16} />
                </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-sm font-medium text-muted transition group-hover:text-foreground sm:hidden">
                <span>{actionLabel}</span>
                <ChevronRight size={16} />
            </div>
        </>
    );

    if (href) {
        return (
            <Link href={href} className={baseClassName}>
                {content}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={mergeClasses(baseClassName, 'w-full text-left')}>
            {content}
        </button>
    );
};

export const SettingsStatusBanner = ({
    action,
    badge,
    description,
    helperText,
    icon,
    title,
    tone = 'brand',
}: SettingsStatusBannerProps) => {
    const toneClassName = getSemanticToneClasses(tone);

    return (
        <div className={mergeClasses('rounded-2xl border p-4 sm:p-5', toneClassName.panel)}>
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    {icon ? (
                        <div className={mergeClasses('mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10', toneClassName.icon)}>
                            {icon}
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">{title}</h3>
                            {badge ? (
                                <span className={mergeClasses('rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', toneClassName.badge)}>
                                    {badge}
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-faint">{description}</p>
                        {helperText ? <p className="mt-2 text-sm leading-6 text-muted">{helperText}</p> : null}
                    </div>
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
        </div>
    );
};

export const SettingsEmptyState = ({
    action,
    description,
    icon,
    title,
    tone = 'brand',
}: SettingsEmptyStateProps) => {
    const toneClassName = getSemanticToneClasses(tone);

    return (
        <div className="rounded-[26px] border border-dashed border-line/40 bg-surface-secondary/35 p-8 text-center sm:p-10">
            {icon ? (
                <div className={mergeClasses('mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10', toneClassName.icon)}>
                    {icon}
                </div>
            ) : null}
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-faint">{description}</p>
            {action ? <div className="mt-6">{action}</div> : null}
        </div>
    );
};

export const SettingsDangerPanel = ({ children, description, icon, title }: SettingsDangerPanelProps) => {
    const toneClassName = getSemanticToneClasses('danger');

    return (
        <section
            className={mergeClasses('rounded-[28px] border p-6 backdrop-blur-sm sm:p-7', toneClassName.panel)}
            style={{ boxShadow: '0 20px 50px -30px rgb(var(--color-danger-shadow-rgb) / 0.45)' }}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    {icon ? (
                        <div className={mergeClasses('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-danger/30', toneClassName.icon)}>
                            {icon}
                        </div>
                    ) : null}
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-faint">{description}</p>
                    </div>
                </div>
            </div>
            {children ? <div className="mt-5 space-y-4">{children}</div> : null}
        </section>
    );
};

export const SettingsToggleRow = ({
    checked,
    checkedLabel = 'On',
    description,
    disabled,
    helperText,
    icon,
    onChange,
    title,
    tone = 'brand',
    uncheckedLabel = 'Off',
}: SettingsToggleRowProps) => {
    const toneClassName = getSemanticToneClasses(tone);

    return (
        <div className="rounded-2xl border border-line/25 bg-surface-secondary/45 p-4 sm:p-5">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    {icon ? (
                        <div className={mergeClasses('mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10', toneClassName.icon)}>
                            {icon}
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">{title}</h3>
                            <span className={mergeClasses('rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', toneClassName.badge)}>
                                {checked ? checkedLabel : uncheckedLabel}
                            </span>
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-faint">{description}</p>
                        {helperText ? <p className="mt-2 text-sm leading-6 text-muted">{helperText}</p> : null}
                    </div>
                </div>
                <label className={mergeClasses('relative inline-flex h-7 w-12 shrink-0 items-center', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        aria-label={title}
                        checked={checked}
                        onChange={(event) => onChange(event.target.checked)}
                        disabled={disabled}
                    />
                    <span className={mergeClasses('h-7 w-12 rounded-full bg-line/45 transition', toneClassName.track)} />
                    <span className="pointer-events-none absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                </label>
            </div>
        </div>
    );
};
