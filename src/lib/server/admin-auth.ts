import { NextRequest, NextResponse } from 'next/server';
import {
    createAppwriteSessionAccount,
    getAppwriteSessionSecret,
    getAppwriteErrorStatus,
} from '@/lib/appwrite/server';
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
        sessionSecret: string;
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
            sessionSecret: 'e2e-token',
        };
    }

    const sessionSecret = getAppwriteSessionSecret(request);
    const userAgent = request.headers.get('user-agent') ?? undefined;

    if (!sessionSecret) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
        };
    }

    try {
        const account = createAppwriteSessionAccount(sessionSecret, userAgent);
        const currentUser = await account.get();

        if (!isAdminEmail(currentUser.email ?? '')) {
            return {
                ok: false,
                response: NextResponse.json({ error: 'Forbidden.' }, { status: 403 }),
            };
        }

        return {
            ok: true,
            user: {
                id: currentUser.$id,
                email: currentUser.email,
            },
            userAgent,
            sessionSecret,
        };
    } catch (error) {
        const status = getAppwriteErrorStatus(error, 401);

        return {
            ok: false,
            response: NextResponse.json({ error: 'Authentication required.' }, { status }),
        };
    }
};
