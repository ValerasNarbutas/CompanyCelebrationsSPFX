import { Card } from '@/components/ui/card'
import { CelebrationEvent } from '@/lib/types'
import { EventCard } from './EventCard'
import { getUpcomingEvents } from '@/lib/calendar-utils'

interface UpcomingEventsProps {
  events: CelebrationEvent[]
  onEventClick?: (event: CelebrationEvent) => void
}

export function UpcomingEvents({ events, onEventClick }: UpcomingEventsProps) {
  const upcomingEvents = getUpcomingEvents(events, 10)

  if (upcomingEvents.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
        <div className="text-center py-8 text-muted-foreground">
          No upcoming events
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
      <div className="flex flex-col gap-3">
        {upcomingEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onClick={() => onEventClick?.(event)}
          />
        ))}
      </div>
    </Card>
  )
}
