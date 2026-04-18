'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/Button';
import { eventCopy } from '@/lib/app-copy';
import { removeEventRsvpAction, setEventRsvpAction } from '@/app/actions/events';

type EventRsvpButtonProps = {
  eventId: string;
  isAttending: boolean;
  compact?: boolean;
};

const EventRsvpButton = ({ eventId, isAttending, compact = false }: EventRsvpButtonProps) => {
  const router = useRouter();
  const [attending, setAttending] = useState(isAttending);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAttending(isAttending);
  }, [isAttending]);

  const handleClick = () => {
    startTransition(async () => {
      const result = attending
        ? await removeEventRsvpAction({ event_id: eventId })
        : await setEventRsvpAction({ event_id: eventId });

      if (!result.success) {
        toast.error(result.error ?? 'Unable to update RSVP');
        return;
      }

      setAttending(result.event?.is_attending ?? !attending);
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      size={compact ? 'sm' : 'md'}
      variant={attending ? 'outline' : 'primary'}
      isLoading={isPending}
      onClick={handleClick}
    >
      {attending ? eventCopy.actions.removeRsvp : eventCopy.actions.setRsvp}
    </Button>
  );
};

export default EventRsvpButton;