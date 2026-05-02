import { redirect } from 'next/navigation';
import { getCurrentUserFromCookies } from '@/lib/server/current-user';
import { AppDataService } from '@/lib/server/app-data-service';
import SettingsPageContent from './SettingsPageContent';

export default async function Settings() {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
        redirect('/login?redirect=/settings');
    }

    const service = new AppDataService();
    const profileData = await service.getProfile(currentUser.id);
    if (!profileData?.first_name) {
        redirect('/onboarding');
    }

    return <SettingsPageContent />;
}
