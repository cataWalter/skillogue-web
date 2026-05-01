import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import { requireAdminRequest } from '@/lib/server/admin-auth';
import type { AdminOutreachRequest } from '@/lib/admin-dashboard';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdminRequest(request);

        if ('response' in admin) {
            return admin.response;
        }

        const { id } = await params;
        const body = (await request.json()) as AdminOutreachRequest;
        const service = new AppDataService(undefined, admin.userAgent);

        switch (body.action) {
            case 'send-message': {
                if (!body.content?.trim()) {
                    return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
                }

                const result = await service.sendAdminMessage({
                    adminUserId: admin.user.id,
                    userId: id,
                    content: body.content.trim(),
                });

                return NextResponse.json({ success: true, result });
            }
            case 'send-notification': {
                if (!body.title?.trim() || !body.content?.trim()) {
                    return NextResponse.json({ error: 'Notification title and body are required.' }, { status: 400 });
                }

                const result = await service.sendAdminNotification({
                    adminUserId: admin.user.id,
                    userId: id,
                    title: body.title.trim(),
                    body: body.content.trim(),
                    url: body.url,
                });

                return NextResponse.json({ success: true, result });
            }
            case 'toggle-verification': {
                if (typeof body.verified !== 'boolean') {
                    return NextResponse.json({ error: 'Verification toggle requires a boolean value.' }, { status: 400 });
                }

                const result = await service.setAdminUserVerified(id, body.verified);
                return NextResponse.json({ success: true, result });
            }
            case 'toggle-follow-up': {
                if (typeof body.followUp !== 'boolean') {
                    return NextResponse.json({ error: 'Follow-up toggle requires a boolean value.' }, { status: 400 });
                }

                const result = await service.toggleAdminFollowUp(id, body.followUp);
                return NextResponse.json({ success: true, result });
            }
            default:
                return NextResponse.json({ error: 'Unsupported admin action.' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error performing admin action:', error);
        return NextResponse.json({ error: 'Failed to perform admin action' }, { status: 500 });
    }
}
