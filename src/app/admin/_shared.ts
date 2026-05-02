import { formatDateTime } from '@/components/admin/AdminDashboardPrimitives';

export const emptyStateClassName =
    'rounded-2xl border border-dashed border-line/40 bg-surface-secondary/35 p-4 text-sm text-faint';
export const adminCardClassName =
    'rounded-2xl border border-line/30 bg-surface-secondary/35 p-4';
export const adminFieldClassName =
    'w-full rounded-xl border border-line/30 bg-surface/70 px-4 py-3 text-sm text-foreground placeholder:text-faint focus:border-brand focus:outline-none';
export const adminSelectClassName =
    'rounded-xl border border-line/30 bg-surface/70 px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none';
export const adminListItemClassName =
    'rounded-xl bg-surface/70 px-3 py-3 text-sm text-muted';

export const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, init);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            payload && typeof payload === 'object' && 'error' in payload
                ? String((payload as { error: unknown }).error)
                : `Request failed for ${url}`;
        throw new Error(message);
    }

    return payload as T;
};

export const createLastUpdatedLabel = (value: string | null) =>
    `Last updated: ${formatDateTime(value)}`;
