import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import { requireAdminRequest } from '@/lib/server/admin-auth';

export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdminRequest(request);

        if ('response' in admin) {
            return admin.response;
        }

        const url = new URL(request.url);
        const query = url.searchParams.get('query');
        const service = new AppDataService(undefined, admin.userAgent);
        const users = await service.listAdminProfiles({ query, limit: 8 });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching admin users:', error);
        return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
    }
}
