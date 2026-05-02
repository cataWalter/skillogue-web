/**
 * Shared date formatting utilities. Prefer these over inline toLocaleDateString()
 * calls to keep formatting consistent and locale-aware across the app.
 */

/** "Jan 5, 2024" — used in search results, admin tables, conversation timestamps */
export const formatShortDate = (iso: string | null | undefined): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/** "January 5, 2024" — used in profile cards and detail views */
export const formatLongDate = (iso: string | null | undefined): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

/** "Jan 5" — used in message timestamps */
export const formatMessageDate = (iso: string | null | undefined): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};
