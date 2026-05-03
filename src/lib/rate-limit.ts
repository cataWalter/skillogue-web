import { NextRequest, NextResponse } from 'next/server';

interface RateLimitWindow {
    count: number;
    resetAt: number;
}

/**
 * In-memory sliding-window rate limiter keyed by IP.
 *
 * NOTE: In a serverless environment (Vercel) each function instance maintains
 * its own store, so limits are per-instance rather than globally enforced.
 * For global rate limiting, replace this store with a Redis/KV backend.
 */
const store = new Map<string, RateLimitWindow>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanExpiredEntries(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;
    for (const [key, window] of store) {
        if (now > window.resetAt) store.delete(key);
    }
}

function getClientIp(request: NextRequest): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        'unknown'
    );
}

export interface RateLimitOptions {
    /** Maximum number of requests allowed within the window. */
    limit: number;
    /** Window duration in milliseconds. */
    windowMs: number;
}

/**
 * Returns a 429 NextResponse if the caller exceeds the rate limit, otherwise
 * returns `null` (meaning the request should proceed).
 *
 * @example
 * const limited = checkRateLimit(request, { limit: 10, windowMs: 60_000 });
 * if (limited) return limited;
 */
export function checkRateLimit(
    request: NextRequest,
    options: RateLimitOptions
): NextResponse | null {
    // Skip rate limiting outside of production (dev server, CI, test runs).
    if (process.env.NODE_ENV !== 'production') {
        return null;
    }

    const { limit, windowMs } = options;
    const now = Date.now();
    cleanExpiredEntries(now);

    const ip = getClientIp(request);
    const key = `${request.nextUrl.pathname}:${ip}`;
    const existing = store.get(key);

    if (existing && now < existing.resetAt) {
        existing.count += 1;
        if (existing.count > limit) {
            const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
            return NextResponse.json(
                { message: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: { 'Retry-After': String(retryAfter) },
                }
            );
        }
    } else {
        store.set(key, { count: 1, resetAt: now + windowMs });
    }

    return null;
}
