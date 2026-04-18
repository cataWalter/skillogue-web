'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createEventSchema,
  eventIdSchema,
  setEventRsvpSchema,
  updateEventSchema,
} from '@/lib/schemas';
import { getCurrentUserFromCookies } from '@/lib/server/current-user';
import { AppDataService } from '@/lib/server/app-data-service';

type EventActionResult = {
  success: boolean;
  error?: string;
  details?: Record<string, string[] | undefined>;
  event?: Awaited<ReturnType<AppDataService['getEventForViewer']>>;
};

const getAuthenticatedUser = async () => {
  const currentUser = await getCurrentUserFromCookies();

  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  return currentUser;
};

const revalidateEventPaths = (eventId?: string | null) => {
  revalidatePath('/events');
  revalidatePath('/dashboard/events');
  revalidatePath('/calendar');

  if (eventId) {
    revalidatePath(`/events/${eventId}`);
  }
};

const validationFailure = (error: z.ZodError): EventActionResult => ({
  success: false,
  error: 'Validation failed',
  details: error.flatten().fieldErrors,
});

const actionFailure = (error: unknown, fallbackMessage: string): EventActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : fallbackMessage,
});

export async function createEventAction(
  data: z.input<typeof createEventSchema>
): Promise<EventActionResult> {
  try {
    const currentUser = await getAuthenticatedUser();
    const validatedData = createEventSchema.parse(data);
    const service = new AppDataService();
    const event = await service.createEvent(currentUser.id, {
      title: validatedData.title,
      description: validatedData.description,
      location_id: validatedData.location_id,
      starts_at: validatedData.starts_at,
      ends_at: validatedData.ends_at ?? null,
      timezone: validatedData.timezone,
      capacity: validatedData.capacity ?? null,
      status: validatedData.status,
    });

    revalidateEventPaths(event?.id);

    return { success: true, event: event ?? undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailure(error);
    }

    return actionFailure(error, 'Failed to create event');
  }
}

export async function updateEventAction(
  data: z.input<typeof updateEventSchema>
): Promise<EventActionResult> {
  try {
    const currentUser = await getAuthenticatedUser();
    const validatedData = updateEventSchema.parse(data);
    const service = new AppDataService();
    const event = await service.updateEvent(currentUser.id, {
      id: validatedData.id,
      title: validatedData.title,
      description: validatedData.description,
      location_id: validatedData.location_id,
      starts_at: validatedData.starts_at,
      ends_at: validatedData.ends_at ?? null,
      timezone: validatedData.timezone,
      capacity: validatedData.capacity ?? null,
    });

    revalidateEventPaths(validatedData.id);

    return { success: true, event: event ?? undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailure(error);
    }

    return actionFailure(error, 'Failed to update event');
  }
}

export async function publishEventAction(eventId: string): Promise<EventActionResult> {
  try {
    const currentUser = await getAuthenticatedUser();
    const validatedData = eventIdSchema.parse({ event_id: eventId });
    const service = new AppDataService();
    const event = await service.publishEvent(currentUser.id, validatedData.event_id);

    revalidateEventPaths(validatedData.event_id);

    return { success: true, event: event ?? undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailure(error);
    }

    return actionFailure(error, 'Failed to publish event');
  }
}

export async function cancelEventAction(eventId: string): Promise<EventActionResult> {
  try {
    const currentUser = await getAuthenticatedUser();
    const validatedData = eventIdSchema.parse({ event_id: eventId });
    const service = new AppDataService();
    const event = await service.cancelEvent(currentUser.id, validatedData.event_id);

    revalidateEventPaths(validatedData.event_id);

    return { success: true, event: event ?? undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailure(error);
    }

    return actionFailure(error, 'Failed to cancel event');
  }
}

export async function setEventRsvpAction(
  data: z.input<typeof setEventRsvpSchema>
): Promise<EventActionResult> {
  try {
    const currentUser = await getAuthenticatedUser();
    const validatedData = setEventRsvpSchema.parse(data);
    const service = new AppDataService();
    const event = await service.setEventRsvp(currentUser.id, validatedData.event_id);

    revalidateEventPaths(validatedData.event_id);

    return { success: true, event: event ?? undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailure(error);
    }

    return actionFailure(error, 'Failed to RSVP to event');
  }
}

export async function removeEventRsvpAction(
  data: z.input<typeof setEventRsvpSchema>
): Promise<EventActionResult> {
  try {
    const currentUser = await getAuthenticatedUser();
    const validatedData = setEventRsvpSchema.parse(data);
    const service = new AppDataService();
    const event = await service.removeEventRsvp(currentUser.id, validatedData.event_id);

    revalidateEventPaths(validatedData.event_id);

    return { success: true, event: event ?? undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailure(error);
    }

    return actionFailure(error, 'Failed to remove RSVP');
  }
}