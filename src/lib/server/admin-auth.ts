import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin';
import { getE2EAdminSession } from '@/lib/e2e-auth';

type AdminRequestResult =
    | {
        ok: true;
        user: {
            id: string;
            email: string;
        };
        userAgent: string | undefined;
    }
    | {
        ok: false;
        response: NextResponse;
    };

export const requireAdminRequest = async (request: NextRequest): Promise<AdminRequestResult> => {
    const e2eSession = getE2EAdminSession(request);

    if (e2eSession) {
        return {
            ok: true,
            user: { id: e2eSession.user.id, email: e2eSession.user.email },
            userAgent: undefined,
        };
    }

    const { userId } = await auth();
    const userAgent = request.headers.get('user-agent') ?? undefined;

    if (!userId) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
        };
    }

    const user = await currentUser();
    const primaryEmail = user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? '';

    if (!isAdminEmail(primaryEmail)) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Forbidden.' }, { status: 403 }),
        };
    }

    return {
        ok: true,
        user: { id: userId, email: primaryEmail },
        userAgent,
    };
};
