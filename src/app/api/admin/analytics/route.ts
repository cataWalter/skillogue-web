import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import { requireAdminRequest } from '@/lib/server/admin-auth';

const getOptionalFilter = (value: string | null) => {
    const normalized = value?.trim();
    return normalized ? normalized : null;
};

export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdminRequest(request);

        if ('response' in admin) {
            return admin.response;
        }

        const url = new URL(request.url);
        const requestedDays = Number(url.searchParams.get('days'));
        const days = Number.isFinite(requestedDays) && requestedDays > 0 ? requestedDays : null;
        const eventType = getOptionalFilter(url.searchParams.get('eventType'));
        const path = getOptionalFilter(url.searchParams.get('path'));
        const exportMode = url.searchParams.get('export') === 'json';
        const service = new AppDataService(undefined, admin.userAgent);

        if (exportMode) {
            const data = await service.exportAdminAnalyticsEvents({ days, eventType, path });

            return NextResponse.json(data, {
                headers: {
                    'Content-Disposition': 'attachment; filename="admin-analytics-export.json"',
                },
            });
        }

        const data = await service.getAdminDashboardSnapshot({ days, eventType, path });
        const exportParams = new URLSearchParams();

        if (days) {
            exportParams.set('days', String(days));
        }

        if (eventType) {
            exportParams.set('eventType', eventType);
        }

        if (path) {
            exportParams.set('path', path);
        }

        exportParams.set('export', 'json');
        data.analytics.filters.exportUrl = `/api/admin/analytics?${exportParams.toString()}`;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching admin analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch admin analytics' }, { status: 500 });
    }
}
