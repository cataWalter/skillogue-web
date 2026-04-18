type TrackAnalyticsOptions = {
    path?: string;
};

export const trackAnalyticsEvent = async (
    eventName: string,
    properties: Record<string, unknown> = {},
    options: TrackAnalyticsOptions = {}
) => {
    const resolvedEventName = eventName.trim();
    const resolvedPath = options.path?.trim() || (typeof window === 'undefined' ? '/' : window.location.pathname);

    if (typeof window === 'undefined') {
        return;
    }

    if (!resolvedEventName || !resolvedPath) {
        return;
    }

    try {
        await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: resolvedEventName,
                properties,
                path: resolvedPath,
            }),
        });
    } catch (error) {
        console.error('Error tracking event:', error);
    }
};
