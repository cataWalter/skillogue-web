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
        const data = await service.getAdminDashboardSnapshot();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        return NextResponse.json({ error: 'Failed to fetch admin dashboard' }, { status: 500 });
    }
}
