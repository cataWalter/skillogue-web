import { redirect } from 'next/navigation';
import { getCurrentUserFromCookies } from '@/lib/server/current-user';
import { AppDataService } from '@/lib/server/app-data-service';
import DashboardClient from './DashboardClient';
import { ProfileData } from '@/types';

export default async function DashboardPage() {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
        redirect('/login?redirect=/dashboard');
    }

    const service = new AppDataService();
    const profileData = await service.getProfile(currentUser.id);

    if (!profileData?.first_name) {
        redirect('/onboarding');
    }

    const passions: unknown[] = (profileData as any).passions ?? [];
    const languages: unknown[] = (profileData as any).languages ?? [];

    const profile: ProfileData = {
        id: profileData.id,
        first_name: profileData.first_name,
        about_me: profileData.about_me,
        passions_count: passions.length,
        languages_count: languages.length,
    };

    return <DashboardClient userId={currentUser.id} initialProfile={profile} />;
}
