import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles, locations, userPassions, passions, profileLanguages, languages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    let location = null;
    if (profile.locationId) {
      const [loc] = await db.select().from(locations).where(eq(locations.id, profile.locationId)).limit(1);
      location = loc;
    }
    
    const userPassionsList = await db.select().from(userPassions)
      .leftJoin(passions, eq(userPassions.passionId, passions.id))
      .where(eq(userPassions.userId, userId));
    
    const profileLangs = await db.select().from(profileLanguages)
      .leftJoin(languages, eq(profileLanguages.languageId, languages.id))
      .where(eq(profileLanguages.profileId, userId));
    
    return NextResponse.json({
      ...profile,
      location,
      passions: userPassionsList.map(p => p.passions?.name).filter(Boolean),
      languages: profileLangs.map(p => p.languages?.name).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const data = await request.json();
    
    await db.update(profiles).set(data).where(eq(profiles.id, userId));
    
    const [updatedProfile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}