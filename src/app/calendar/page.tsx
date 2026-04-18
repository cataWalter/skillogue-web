import { redirect } from 'next/navigation';
import CalendarView from '@/components/events/CalendarView';
import { AppDataService } from '@/lib/server/app-data-service';
import { getCurrentUserFromCookies } from '@/lib/server/current-user';

export default async function CalendarPage() {
  const currentUser = await getCurrentUserFromCookies();

  if (!currentUser) {
    redirect('/login');
  }

  const service = new AppDataService();
  const events = await service.listCalendarEventsForUser(currentUser.id);

  return (
    <div className="editorial-shell py-8 sm:py-12 lg:py-16">
      <CalendarView events={events} />
    </div>
  );
}