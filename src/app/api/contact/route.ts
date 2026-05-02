import { NextRequest, NextResponse } from 'next/server';
import { AppDataService } from '@/lib/server/app-data-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

/** Rate limit: 5 contact form submissions per 10 minutes per IP. */
const CONTACT_RATE_LIMIT = { limit: 5, windowMs: 10 * 60_000 } as const;

const CONTACT_CATEGORIES = ['general', 'bug', 'feature', 'billing', 'abuse', 'other'] as const;

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(300),
  message: z.string().min(1).max(5000),
  category: z.enum(CONTACT_CATEGORIES).optional(),
});

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, CONTACT_RATE_LIMIT);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const { name, email, subject, message, category } = parsed.data;
    const service = new AppDataService();

    await service.createContactRequest({
      name,
      email,
      subject,
      message,
      category: category ?? 'general',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving contact request:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
