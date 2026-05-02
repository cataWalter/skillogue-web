import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Edit } from 'lucide-react';
import ProfileCard from '../../components/ProfileCard';
import { FullProfile } from '../../types';
import { profilePageCopy } from '../../lib/app-copy';
import { getCurrentUserFromCookies } from '@/lib/server/current-user';
import { AppDataService } from '@/lib/server/app-data-service';

export default async function Profile() {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
        redirect('/login?redirect=/profile');
    }

    const service = new AppDataService();
    const profileData = await service.getProfile(currentUser.id);

    if (!profileData?.first_name) {
        redirect('/edit-profile');
    }

    const profile = profileData as unknown as FullProfile;
    const passions: string[] = (profileData as any).passions ?? [];
    const languages: string[] = (profileData as any).languages ?? [];

    const actionButton = (
        <Link
            href="/edit-profile"
            className="self-center sm:self-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-white shadow-glass-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-md"
        >
            <Edit size={16} /> {profilePageCopy.owner.editProfile}
        </Link>
    );

    return (
        <main className="editorial-shell flex-grow py-8 sm:py-12 lg:py-16">
            <div className="max-w-4xl mx-auto">
                <ProfileCard
                    profile={profile}
                    passions={passions}
                    languages={languages}
                    actionSlot={actionButton}
                />
            </div>
        </main>
    );
}
