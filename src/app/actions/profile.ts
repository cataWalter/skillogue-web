'use server';
 
 import { profileSchema } from '@/lib/schemas';
 import { revalidatePath } from 'next/cache';
 import { z } from 'zod';
 import { getCurrentUserFromCookies } from '@/lib/server/current-user';
 import { AppDataService } from '@/lib/server/app-data-service';
 
export async function updateProfile(data: z.input<typeof profileSchema>) {
   try {
     const validatedData = profileSchema.parse(data);
 
     const currentUser = await getCurrentUserFromCookies();
     if (!currentUser) {
       return { success: false, error: 'Not authenticated' };
     }
 
     const service = new AppDataService();
     await service.saveProfileData(currentUser.id, validatedData);
     
     console.log('Updating profile with:', validatedData);
     
     revalidatePath('/profile');
     revalidatePath('/dashboard');
     revalidatePath('/settings/privacy');
     
     return { success: true };
   } catch (error) {
     if (error instanceof z.ZodError) {
       const details = error.flatten().fieldErrors;
       console.error('Profile validation error:', details);
       return { success: false, error: 'Validation failed', details };
     }
     console.error('Profile update error:', error);
     return { success: false, error: 'Failed to update profile' };
   }
 }
 
 export async function getProfile(userId: string) {
   try {
     const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/profile/${userId}`, {
       cache: 'no-store',
       headers: { 'Content-Type': 'application/json' },
     });
 
     if (!response.ok) {
       return null;
     }
 
     console.log('Fetching profile for:', userId);
     return response.json();
   } catch (error) {
     console.error('Profile fetch error:', error);
     return null;
   }
 }
