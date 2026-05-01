import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import { requireAdminRequest } from '@/lib/server/admin-auth';

export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdminRequest(request);

        if ('response' in admin) {
            return admin.response;
        }

        const service = new AppDataService(undefined, admin.userAgent);
        const settings = await service.getAdminSettings();

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching admin settings:', error);
        return NextResponse.json({ error: 'Failed to fetch admin settings' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const admin = await requireAdminRequest(request);

        if ('response' in admin) {
            return admin.response;
        }

        const body = await request.json();
        const service = new AppDataService(undefined, admin.userAgent);
        const settings = await service.updateAdminSettings({
            maintenanceBannerText: typeof body.maintenanceBannerText === 'string' ? body.maintenanceBannerText : undefined,
            analyticsRefreshMinutes:
                typeof body.analyticsRefreshMinutes === 'number' ? body.analyticsRefreshMinutes : undefined,
            moderationHold: typeof body.moderationHold === 'boolean' ? body.moderationHold : undefined,
            followUpUserIds: Array.isArray(body.followUpUserIds) ? body.followUpUserIds : undefined,
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating admin settings:', error);
        return NextResponse.json({ error: 'Failed to update admin settings' }, { status: 500 });
    }
}
