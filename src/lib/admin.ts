const ADMIN_EMAILS = ['cata.walter@gmail.com'] as const;

const normalizeEmail = (value: string | null | undefined) => value?.trim().toLowerCase() ?? '';

export const adminEmails = [...ADMIN_EMAILS];

export const isAdminEmail = (value: string | null | undefined) =>
    adminEmails.includes(normalizeEmail(value) as (typeof ADMIN_EMAILS)[number]);
