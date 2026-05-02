import { redirect } from 'next/navigation';
import { getCurrentUserFromCookies } from '@/lib/server/current-user';
import { AppDataService } from '@/lib/server/app-data-service';
import FavoritesClient from './FavoritesClient';

export default async function FavoritesPage() {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
        redirect('/login?redirect=/favorites');
    }

    const service = new AppDataService();
    const profileData = await service.getProfile(currentUser.id);
    if (!profileData?.first_name) {
        redirect('/onboarding');
    }

    const favorites = await service.getFavorites(currentUser.id);

    return <FavoritesClient initialFavorites={(favorites as any[]).filter(Boolean)} />;
}
