import { redirect } from 'next/navigation';
import DashboardEventsClient from '@/components/events/DashboardEventsClient';
import { AppDataService } from '@/lib/server/app-data-service';
import { getCurrentUserFromCookies } from '@/lib/server/current-user';

export default async function DashboardEventsPage() {
  const currentUser = await getCurrentUserFromCookies();

  if (!currentUser) {
    redirect('/login');
  }

  const service = new AppDataService();
  const [events, locations] = await Promise.all([
    service.listCreatorEvents(currentUser.id),
    service.listLocations(),
  ]);

  return (
    <div className="editorial-shell py-8 sm:py-12 lg:py-16">
      <DashboardEventsClient events={events} locations={locations} />
    </div>
  );
}