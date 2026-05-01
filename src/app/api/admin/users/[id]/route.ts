import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import { requireAdminRequest } from '@/lib/server/admin-auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdminRequest(request);

        if ('response' in admin) {
            return admin.response;
        }

        const { id } = await params;
        const service = new AppDataService(undefined, admin.userAgent);
        const payload = await service.getAdminUserInvestigation(id);

        return NextResponse.json(payload);
    } catch (error) {
        console.error('Error fetching admin user investigation:', error);
        return NextResponse.json({ error: 'Failed to fetch admin user investigation' }, { status: 500 });
    }
}
