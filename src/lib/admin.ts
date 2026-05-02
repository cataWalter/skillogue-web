const normalizeEmail = (value: string | null | undefined) => value?.trim().toLowerCase() ?? '';

const rawAdminEmails = process.env.ADMIN_EMAILS ?? '';

export const adminEmails = rawAdminEmails
    .split(',')
    .map((e) => normalizeEmail(e))
    .filter(Boolean);

export const isAdminEmail = (value: string | null | undefined) =>
    adminEmails.includes(normalizeEmail(value));
