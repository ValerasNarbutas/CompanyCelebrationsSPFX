import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { CelebrationEvent, EventType } from '@/lib/types'
import { AddEventDialog } from '@/components/AddEventDialog'
import { EditEventDialog } from '@/components/EditEventDialog'
import { CalendarView } from '@/components/CalendarView'
import { UpcomingEvents } from '@/components/UpcomingEvents'
import { EventFilter } from '@/components/EventFilter'
import { EmptyState } from '@/components/EmptyState'
import { Toaster } from '@/components/ui/sonner'
import { Confetti } from '@phosphor-icons/react'

function App() {
  const [events, setEvents] = useKV<CelebrationEvent[]>('celebration-events', [])
  const [selectedFilter, setSelectedFilter] = useState<EventType | 'all'>('all')
  const [editingEvent, setEditingEvent] = useState<CelebrationEvent | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const safeEvents = events || []

  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'all') return safeEvents
    return safeEvents.filter(event => event.type === selectedFilter)
  }, [safeEvents, selectedFilter])

  const handleAddEvent = (newEvent: Omit<CelebrationEvent, 'id'>) => {
    setEvents((currentEvents) => [
      ...(currentEvents || []),
      { ...newEvent, id: crypto.randomUUID() }
    ])
  }

  const handleEditEvent = (id: string, updatedEvent: Omit<CelebrationEvent, 'id'>) => {
    setEvents((currentEvents) =>
      (currentEvents || []).map(event =>
        event.id === id ? { ...updatedEvent, id } : event
      )
    )
  }

  const handleDeleteEvent = (id: string) => {
    setEvents((currentEvents) =>
      (currentEvents || []).filter(event => event.id !== id)
    )
  }

  const handleEventClick = (event: CelebrationEvent) => {
    setEditingEvent(event)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Confetti size={28} weight="fill" className="text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Celebrations Calendar</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Never miss a birthday or special day again
          </p>
        </header>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <EventFilter selectedType={selectedFilter} onTypeChange={setSelectedFilter} />
          <AddEventDialog onAdd={handleAddEvent} />
        </div>

        {safeEvents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CalendarView 
                events={filteredEvents} 
                onDateClick={(_, dayEvents) => {
                  if (dayEvents.length > 0) {
                    handleEventClick(dayEvents[0])
                  }
                }}
              />
            </div>
            <div>
              <UpcomingEvents 
                events={filteredEvents} 
                onEventClick={handleEventClick}
              />
            </div>
          </div>
        )}
      </div>

      <EditEventDialog
        event={editingEvent}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <Toaster position="top-center" />
    </div>
  )
}

export default App